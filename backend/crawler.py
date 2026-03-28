from __future__ import annotations

import re
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from jobspy import scrape_jobs
except Exception as exc:  # pragma: no cover
    scrape_jobs = None
    IMPORT_ERROR = exc
else:
    IMPORT_ERROR = None


class CrawlRequest(BaseModel):
    skills: list[str] = Field(default_factory=list)
    experience: list[dict] = Field(default_factory=list)
    education: list[dict] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)


class JobItem(BaseModel):
    id: str
    title: str
    company: str
    location: str
    mode: Literal["remote", "hybrid", "onsite"]
    platform: Literal["Indeed", "LinkedIn"]
    url: str
    description: str
    matchedSkills: list[str]


app = FastAPI(title="Trabahound Crawler Service")

SENIOR_TITLE_TERMS = {
    "senior",
    "sr",
    "lead",
    "manager",
    "principal",
    "architect",
    "head",
    "director",
}

ENTRY_TERMS = {
    "entry",
    "junior",
    "associate",
    "fresh",
    "graduate",
    "intern",
    "trainee",
}

QA_TERMS = {"qa", "quality assurance", "test automation", "tester", "sdet"}


def _mode_from_text(text: str) -> Literal["remote", "hybrid", "onsite"]:
    lower = text.lower()
    if "hybrid" in lower:
        return "hybrid"
    if "remote" in lower or "work from home" in lower or "wfh" in lower:
        return "remote"
    return "onsite"


def _platform_name(site: str) -> Literal["Indeed", "LinkedIn"]:
    lower = site.lower()
    if "linkedin" in lower:
        return "LinkedIn"
    return "Indeed"


def _normalize_text(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (list, tuple, set)):
        parts = [_normalize_text(item) for item in value]
        return "\n".join([part for part in parts if part])
    if isinstance(value, dict):
        parts = [_normalize_text(item) for item in value.values()]
        return "\n".join([part for part in parts if part])
    return str(value).strip()


def _extract_description(record: dict) -> str:
    candidates = [
        record.get("description"),
        record.get("job_description"),
        record.get("job_summary"),
        record.get("summary"),
        record.get("snippet"),
        record.get("description_text"),
        record.get("job_highlights"),
        record.get("highlights"),
    ]

    for candidate in candidates:
        text = _normalize_text(candidate)
        if text:
            return text

    return ""


def _extract_years(text: str) -> float:
    if not text:
        return 0.0

    lower = text.lower()
    # Handles: "2 years", "2+ years", "1-3 years", "3 to 5 years", "18 months".
    year_matches = re.findall(r"(\d+)\s*(?:\+|plus)?\s*(?:-|to)?\s*(\d+)?\s*years?", lower)
    month_matches = re.findall(r"(\d+)\s*(?:\+|plus)?\s*months?", lower)

    values: list[float] = []
    for start, end in year_matches:
        first = float(start)
        second = float(end) if end else first
        values.append(min(first, second))

    for months in month_matches:
        values.append(float(months) / 12.0)

    return max(values) if values else 0.0


def _min_required_years(text: str) -> float:
    if not text:
        return 0.0

    lower = text.lower()
    matches = re.findall(r"(\d+)\s*(?:\+|plus)?\s*(?:-|to)?\s*(\d+)?\s*years?", lower)
    if not matches:
        return 0.0

    mins: list[float] = []
    for start, end in matches:
        first = float(start)
        second = float(end) if end else first
        mins.append(min(first, second))
    return min(mins) if mins else 0.0


def _profile_has_qa_signals(skills: list[str], experience: list[dict]) -> bool:
    combined = " ".join(skills + [str(item.get("role") or "") + " " + str(item.get("description") or "") for item in experience]).lower()
    return any(term in combined for term in QA_TERMS)


def _is_senior_title(title: str) -> bool:
    lower = title.lower()
    words = set(re.findall(r"[a-zA-Z]+", lower))
    return any(term in words for term in SENIOR_TITLE_TERMS)


def _score_job(title: str, description: str, matched_skills: list[str], required_years: float) -> float:
    lower_title = title.lower()
    lower_desc = description.lower()

    score = float(len(matched_skills) * 12)
    score += sum(2.0 for skill in matched_skills if skill.lower() in lower_title)
    score += 3.0 if any(term in lower_title for term in ENTRY_TERMS) else 0.0
    score -= required_years * 2.0
    score += 1.0 if "remote" in lower_desc else 0.0
    return score


@app.post("/crawl", response_model=list[JobItem])
def crawl_jobs(payload: CrawlRequest) -> list[JobItem]:
    if IMPORT_ERROR or scrape_jobs is None:
        raise HTTPException(
            status_code=500,
            detail="jobspy is not available. Run: pip install fastapi uvicorn jobspy",
        )

    skills = [skill.strip() for skill in payload.skills if skill and skill.strip()]
    if not skills:
        raise HTTPException(status_code=400, detail="skills must include at least one value")

    candidate_years = max(
        [_extract_years(str(item.get("duration") or "")) for item in payload.experience] or [0.0]
    )
    has_qa_background = _profile_has_qa_signals(skills, payload.experience)

    top_skills = skills[:3]
    query = " ".join(top_skills)

    try:
        jobs_df = scrape_jobs(
            site_name=["indeed", "linkedin"],
            search_term=query,
            location="Philippines",
            results_wanted=60,
            hours_old=168,
            country_indeed="Philippines",
        )
    except TypeError:
        # Compatibility fallback for older/newer jobspy signatures.
        jobs_df = scrape_jobs(
            site_name=["indeed", "linkedin"],
            search_term=query,
            location="Philippines",
            results_wanted=60,
            hours_old=168,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"job crawl failed: {exc}") from exc

    records = jobs_df.fillna("").to_dict(orient="records")
    scored: list[tuple[float, JobItem]] = []

    for index, record in enumerate(records):
        title = str(record.get("title") or "")
        description = _extract_description(record)
        body = f"{title} {description}".lower()

        matched_skills = [skill for skill in skills if skill.lower() in body]
        if not matched_skills:
            continue

        if _is_senior_title(title):
            continue

        required_years = _min_required_years(body)
        if required_years > candidate_years + 1.0:
            continue

        if not has_qa_background and any(term in body for term in QA_TERMS):
            continue

        site = str(record.get("site") or record.get("site_name") or "Indeed")
        company = str(record.get("company") or record.get("company_name") or "Unknown")
        location = str(record.get("location") or record.get("job_location") or "Unknown")
        url = str(record.get("job_url") or record.get("url") or "")

        mode_text = " ".join(
            [
                title,
                description,
                str(record.get("is_remote") or ""),
                str(record.get("job_type") or ""),
                location,
            ]
        )
        mode = _mode_from_text(mode_text)

        if not url:
            continue

        job = JobItem(
            id=f"{_platform_name(site).lower()}-{index}",
            title=title,
            company=company,
            location=location,
            mode=mode,
            platform=_platform_name(site),
            url=url,
            description=description,
            matchedSkills=matched_skills,
        )
        score = _score_job(title, description, matched_skills, required_years)
        scored.append((score, job))

    scored.sort(key=lambda item: item[0], reverse=True)
    return [job for _, job in scored[:50]]


# Run with:
# pip install fastapi uvicorn jobspy
# uvicorn crawler:app --reload
