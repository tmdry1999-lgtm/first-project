const NEIS_BASE = "https://open.neis.go.kr/hub";
const STORAGE_KEY = "meal-notifier-school";
const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

// 나이스 급식 메뉴에 붙는 알레르기 번호 안내
const ALLERGY_MAP = {
  1: "난류",
  2: "우유",
  3: "메밀",
  4: "땅콩",
  5: "대두",
  6: "밀",
  7: "고등어",
  8: "게",
  9: "새우",
  10: "돼지고기",
  11: "복숭아",
  12: "토마토",
  13: "아황산류",
  14: "호두",
  15: "닭고기",
  16: "쇠고기",
  17: "오징어",
  18: "조개류",
  19: "잣",
};

const els = {
  search: document.getElementById("school-search"),
  searchBtn: document.getElementById("search-btn"),
  results: document.getElementById("school-results"),
  selected: document.getElementById("selected-school"),
  weekday: document.getElementById("weekday"),
  dateTitle: document.getElementById("date-title"),
  prev: document.getElementById("prev-day"),
  next: document.getElementById("next-day"),
  today: document.getElementById("today-btn"),
  board: document.getElementById("meal-board"),
  allergyList: document.getElementById("allergy-list"),
};

let selectedSchool = loadSchool();
let viewDate = todayInSeoul();

function todayInSeoul() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year").value);
  const month = Number(parts.find((part) => part.type === "month").value);
  const day = Number(parts.find((part) => part.type === "day").value);
  return new Date(year, month - 1, day);
}

function shiftDate(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function isSameDay(a, b) {
  return toYmd(a) === toYmd(b);
}

function loadSchool() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSchool(school) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(school));
}

async function fetchNeis(endpoint, params) {
  const url = new URL(`${NEIS_BASE}/${endpoint}`);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", "20");

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("급식 정보를 불러오지 못했습니다.");
  }
  return response.json();
}

function parseDish(raw) {
  const text = raw.replace(/<br\s*\/?>/gi, "\n").trim();
  const match = text.match(/^(.*?)(?:\s*\(([0-9.]+)\))?$/);
  const name = (match?.[1] || text).replace(/\s+/g, " ").trim();
  const codes = (match?.[2] || "")
    .split(".")
    .map((code) => Number(code))
    .filter((code) => ALLERGY_MAP[code]);

  return { name, codes };
}

function renderAllergyGuide() {
  els.allergyList.innerHTML = Object.entries(ALLERGY_MAP)
    .map(([code, name]) => `<li>${code}. ${name}</li>`)
    .join("");
}

function renderDate() {
  const today = todayInSeoul();
  els.weekday.textContent = WEEKDAYS[viewDate.getDay()];
  els.dateTitle.textContent = `${viewDate.getFullYear()}년 ${viewDate.getMonth() + 1}월 ${viewDate.getDate()}일`;
  els.today.hidden = isSameDay(viewDate, today);
}

function renderSelectedSchool() {
  if (!selectedSchool) {
    els.selected.textContent = "학교를 검색해 선택해 주세요.";
    return;
  }

  els.selected.textContent = `${selectedSchool.SCHUL_NM} · ${selectedSchool.ATPT_OFCDC_SC_NM}`;
}

function showEmpty(title, message) {
  els.board.innerHTML = `
    <article class="empty-state">
      <strong>${title}</strong>
      <p>${message}</p>
    </article>
  `;
}

function buildNaverImageSearchUrl(query) {
  return `https://search.naver.com/search.naver?where=image&sm=tab_jum&query=${encodeURIComponent(query)}`;
}

function attachMealSearchHandlers() {
  els.board.querySelectorAll(".dish-search-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const query = button.dataset.query;
      if (!query) return;
      window.open(buildNaverImageSearchUrl(query), "_blank", "noopener,noreferrer");
    });
  });
}

function renderMeals(rows) {
  if (!rows.length) {
    showEmpty("급식 정보가 없습니다", "주말, 공휴일, 방학이거나 아직 식단이 등록되지 않았을 수 있습니다.");
    return;
  }

  els.board.innerHTML = rows
    .map((row) => {
      const dishes = row.DDISH_NM.split(/<br\s*\/?>/i)
        .map(parseDish)
        .filter((dish) => dish.name);

      const dishHtml = dishes
        .map((dish) => {
          const tags = dish.codes.map((code) => ALLERGY_MAP[code]).join(", ");
          const searchQuery = `${dish.name} 음식`;
          return `
            <li>
              <button type="button" class="dish-search-btn" data-query="${searchQuery}">
                <span>${dish.name}</span>
                <span class="allergy-tags">${tags || ""}</span>
              </button>
            </li>
          `;
        })
        .join("");

      return `
        <article class="meal-card">
          <div class="meal-head">
            <h3>${row.MMEAL_SC_NM}</h3>
            <span class="kcal">${row.CAL_INFO || ""}</span>
          </div>
          <ul class="dish-list">${dishHtml}</ul>
        </article>
      `;
    })
    .join("");

  attachMealSearchHandlers();
}

async function loadMeals() {
  renderDate();

  if (!selectedSchool) {
    showEmpty("학교를 먼저 선택해 주세요", "검색창에 학교 이름을 입력하면 전국 초·중·고 급식을 조회할 수 있습니다.");
    return;
  }

  showEmpty("급식을 불러오는 중...", "잠시만 기다려 주세요.");

  try {
    const data = await fetchNeis("mealServiceDietInfo", {
      ATPT_OFCDC_SC_CODE: selectedSchool.ATPT_OFCDC_SC_CODE,
      SD_SCHUL_CODE: selectedSchool.SD_SCHUL_CODE,
      MLSV_YMD: toYmd(viewDate),
    });

    if (data.RESULT?.CODE === "INFO-200" || !data.mealServiceDietInfo) {
      renderMeals([]);
      return;
    }

    const rows = data.mealServiceDietInfo[1]?.row || [];
    renderMeals(rows);
  } catch (error) {
    showEmpty("불러오기 실패", error.message);
  }
}

async function searchSchools() {
  const query = els.search.value.trim();
  if (query.length < 2) {
    els.results.hidden = true;
    els.results.innerHTML = "";
    return;
  }

  try {
    const data = await fetchNeis("schoolInfo", { SCHUL_NM: query });
    const rows = data.schoolInfo?.[1]?.row || [];

    if (!rows.length) {
      els.results.hidden = false;
      els.results.innerHTML = "<li><button type='button' disabled>검색 결과가 없습니다.</button></li>";
      return;
    }

    els.results.hidden = false;
    els.results.innerHTML = rows
      .map(
        (school, index) => `
          <li>
            <button type="button" data-index="${index}">
              ${school.SCHUL_NM}
              <span class="school-meta">${school.ATPT_OFCDC_SC_NM} · ${school.SCHUL_KND_SC_NM} · ${school.ORG_RDNMA}</span>
            </button>
          </li>
        `
      )
      .join("");

    els.results.querySelectorAll("button[data-index]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedSchool = rows[Number(button.dataset.index)];
        saveSchool(selectedSchool);
        els.results.hidden = true;
        els.search.value = selectedSchool.SCHUL_NM;
        renderSelectedSchool();
        loadMeals();
      });
    });
  } catch (error) {
    els.results.hidden = false;
    els.results.innerHTML = `<li><button type="button" disabled>${error.message}</button></li>`;
  }
}

els.searchBtn.addEventListener("click", searchSchools);
els.search.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchSchools();
  }
});

els.prev.addEventListener("click", () => {
  viewDate = shiftDate(viewDate, -1);
  loadMeals();
});

els.next.addEventListener("click", () => {
  viewDate = shiftDate(viewDate, 1);
  loadMeals();
});

els.today.addEventListener("click", () => {
  viewDate = todayInSeoul();
  loadMeals();
});

renderAllergyGuide();
renderSelectedSchool();
if (selectedSchool) {
  els.search.value = selectedSchool.SCHUL_NM;
}
loadMeals();
