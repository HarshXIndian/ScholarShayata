const allCoursesGrid = document.querySelector("[data-all-courses]");
const coursesCountText = document.querySelector("#courses-count");
const coursesSearchInput = document.querySelector("#course-search");
const coursesSortSelect = document.querySelector("#course-sort");
const categoryFiltersWrap = document.querySelector("#category-filters");
const loadMoreCoursesButton = document.querySelector("#load-more-courses");

const allCoursesCatalog = Array.isArray(window.courseCatalog)
  ? [...window.courseCatalog]
  : [];

if (allCoursesGrid) {
  const state = {
    query: "",
    category: "All",
    sortBy: "recommended",
    visibleCount: 9,
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const formatAmount = (value) =>
    Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const parseDurationWeeks = (durationText) => {
    const matched = String(durationText || "").match(/\d+/);
    return matched ? Number(matched[0]) : 0;
  };

  const categories = [
    "All",
    ...new Set(allCoursesCatalog.map((course) => course.category)),
  ];

  const queryParams = new URLSearchParams(window.location.search);
  const initialCategory = queryParams.get("category");
  if (initialCategory && categories.includes(initialCategory)) {
    state.category = initialCategory;
  }

  const initialQuery =
    queryParams.get("q") || queryParams.get("query") || queryParams.get("search");
  if (initialQuery) {
    state.query = initialQuery.trim().toLowerCase();
  }

  const renderCategoryFilters = () => {
    if (!categoryFiltersWrap) return;
    categoryFiltersWrap.innerHTML = categories
      .map((category) => {
        const isActive = category === state.category;
        return `
          <button
            type="button"
            class="filter-chip ${isActive ? "active" : ""}"
            data-category="${escapeHtml(category)}"
          >
            ${escapeHtml(category)}
          </button>
        `;
      })
      .join("");
  };

  const renderCourseCard = (course) => {
    const priceText = course.priceLabel
      ? escapeHtml(course.priceLabel)
      : `&#8377;${formatAmount(course.price)}`;
    const oldPriceText = course.mrpLabel
      ? escapeHtml(course.mrpLabel)
      : course.mrp
        ? `MRP &#8377;${formatAmount(course.mrp)}`
        : "";
    const oldPriceClass = course.mrpLabel ? "old-price note" : "old-price";
    const isFree =
      course.priceLabel?.toLowerCase() === "free" || Number(course.price) === 0;

    return `
      <article class="course-card">
        ${isFree ? '<span class="free-badge">Free</span>' : ""}
        <img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.title)}" />
        <div class="course-body">
          <span class="tag">${escapeHtml(course.category)}</span>
          <h3>${escapeHtml(course.title)}</h3>
          <p>by ${escapeHtml(course.instructor)}</p>
          <p class="course-snippet">${escapeHtml(course.description || "")}</p>
          <div class="price-row">
            <strong class="price">${priceText}</strong>
            ${
              oldPriceText
                ? `<span class="${oldPriceClass}">${oldPriceText}</span>`
                : ""
            }
          </div>
          <div class="card-footer">
            <span>${escapeHtml(course.duration || "Self-paced")}</span>
            <a href="#" data-view-course="${escapeHtml(course.id)}">View details</a>
          </div>
        </div>
      </article>
    `;
  };

  const renderPlaceholderCard = (index) => `
    <article class="course-card placeholder" aria-hidden="true">
      <div class="placeholder-media"></div>
      <div class="course-body">
        <span class="tag">Coming Soon</span>
        <h3>New Course Slot</h3>
        <p class="course-snippet">
          We are preparing more courses for this space.
        </p>
        <div class="price-row">
          <strong class="price">---</strong>
          <span class="old-price">Stay tuned</span>
        </div>
        <div class="card-footer">
          <span>Launching soon</span>
          <span class="placeholder-link">Unavailable</span>
        </div>
      </div>
    </article>
  `;

  const getProcessedCourses = () => {
    let processed = [...allCoursesCatalog];

    if (state.query) {
      processed = processed.filter((course) => {
        const searchableText = `${course.title} ${course.instructor} ${course.category} ${course.description}`.toLowerCase();
        return searchableText.includes(state.query);
      });
    }

    if (state.category !== "All") {
      processed = processed.filter((course) => course.category === state.category);
    }

    switch (state.sortBy) {
      case "price-low":
        processed.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        processed.sort((a, b) => b.price - a.price);
        break;
      case "duration-high":
        processed.sort(
          (a, b) => parseDurationWeeks(b.duration) - parseDurationWeeks(a.duration)
        );
        break;
      case "newest":
        processed.sort((a, b) => b.id - a.id);
        break;
      case "name-asc":
        processed.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return processed;
  };

  const renderCourses = () => {
    const processedCourses = getProcessedCourses();
    const visibleCourses = processedCourses.slice(0, state.visibleCount);

    if (coursesCountText) {
      coursesCountText.textContent = `${processedCourses.length} courses found`;
    }

    if (processedCourses.length === 0) {
      allCoursesGrid.innerHTML = `
        <article class="empty-courses">
          No course matched your filters. Try another keyword or category.
        </article>
      `;
      if (loadMoreCoursesButton) {
        loadMoreCoursesButton.hidden = true;
      }
      return;
    }

    const showPlaceholders = state.query === "" && state.category === "All";
    const placeholderSlots =
      showPlaceholders && state.visibleCount <= 9
        ? Math.max(0, 9 - visibleCourses.length)
        : 0;

    allCoursesGrid.innerHTML = [
      ...visibleCourses.map(renderCourseCard),
      ...Array.from({ length: placeholderSlots }, (_, index) =>
        renderPlaceholderCard(index)
      ),
    ].join("");

    if (loadMoreCoursesButton) {
      loadMoreCoursesButton.hidden = processedCourses.length <= state.visibleCount;
    }
  };

  if (coursesSearchInput) {
    coursesSearchInput.value = state.query;
    coursesSearchInput.addEventListener("input", () => {
      state.query = coursesSearchInput.value.trim().toLowerCase();
      state.visibleCount = 9;
      renderCourses();
    });
  }

  if (coursesSortSelect) {
    coursesSortSelect.value = state.sortBy;
    coursesSortSelect.addEventListener("change", () => {
      state.sortBy = coursesSortSelect.value;
      state.visibleCount = 9;
      renderCourses();
    });
  }

  if (categoryFiltersWrap) {
    categoryFiltersWrap.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest("[data-category]");
      if (!button) return;

      state.category = button.dataset.category || "All";
      state.visibleCount = 9;
      renderCategoryFilters();
      renderCourses();
    });
  }

  if (loadMoreCoursesButton) {
    loadMoreCoursesButton.addEventListener("click", () => {
      state.visibleCount += 9;
      renderCourses();
    });
  }

  renderCategoryFilters();
  renderCourses();
}
