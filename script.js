const menuButton = document.querySelector("[data-menu-button]");
const nav = document.querySelector("[data-nav]");
const year = document.querySelector("#year");
const counters = document.querySelectorAll(".count-up");
const dialogs = document.querySelectorAll("[data-dialog]");
const contactForm = document.querySelector("[data-contact-form]");
const contactDialogTitle = document.querySelector("[data-contact-dialog-title]");
const contactFormTitleInput = document.querySelector("[data-contact-form-title]");
const contactRequestTypeInput = document.querySelector(
  "[data-contact-request-type]"
);
const contactCourseTitleInput = document.querySelector("[data-course-title]");
const contactCoursePriceInput = document.querySelector("[data-course-price]");
const contactPaymentMethodInput = document.querySelector("[data-payment-method]");
const featuredCoursesGrid = document.querySelector("[data-featured-courses]");
const courseDetailsDialog = document.querySelector(
  '[data-dialog="course-details-dialog"]'
);
const courseDetailsContent = document.querySelector("[data-course-dialog-content]");
const courseDetailsTitle = document.querySelector("#course-details-title");
const courseDetailsSubtitle = document.querySelector(
  "[data-course-dialog-subtitle]"
);
const courseCatalog = Array.isArray(window.courseCatalog)
  ? window.courseCatalog
  : [];

let activeDialog = null;
const EMAILJS_SERVICE_ID = "service_5xb7nfk";
const EMAILJS_TEMPLATE_ID = "template_79ynf38";
const EMAILJS_PAYMENT_TEMPLATE_ID = "template_z2gsmr9";
const EMAILJS_PUBLIC_KEY = "QiezyPTWzynbAWbeW";
const UPI_ID = "9518816505-2@ybl";
const UPI_RECEIVER_NAME = "ScholarShayata";
let emailJsReady = false;

const initEmailJs = () => {
  if (emailJsReady) return;
  if (!window.emailjs || !EMAILJS_PUBLIC_KEY) return;
  window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  emailJsReady = true;
};

if (window.emailjs) {
  initEmailJs();
}

const setContactDialogContext = ({
  titleText,
  requestType = "general",
  courseTitle = "",
  coursePrice = "",
  paymentMethod = "",
} = {}) => {
  const resolvedTitle = titleText || "We will contact you ASAP";
  if (contactDialogTitle) {
    contactDialogTitle.textContent = resolvedTitle;
  }
  if (contactFormTitleInput) {
    contactFormTitleInput.value = resolvedTitle;
  }
  if (contactRequestTypeInput) {
    contactRequestTypeInput.value = requestType;
  }
  if (contactCourseTitleInput) {
    contactCourseTitleInput.value = courseTitle;
  }
  if (contactCoursePriceInput) {
    contactCoursePriceInput.value = coursePrice;
  }
  if (contactPaymentMethodInput) {
    contactPaymentMethodInput.value = paymentMethod;
  }
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

const buildContactMessageBody = ({
  requestType,
  name,
  gender,
  contactMethod,
  email,
  phone,
  courseTitle,
  coursePrice,
  paymentMethod,
}) => {
  const lines = [];
  const normalizedType = requestType || "general";
  lines.push(`Request type: ${normalizedType}`);
  lines.push(`Name: ${name || "N/A"}`);
  lines.push(`Gender: ${gender || "N/A"}`);
  lines.push(`Preferred contact: ${contactMethod || "N/A"}`);
  lines.push(`Email: ${email || "N/A"}`);
  lines.push(`Phone/WhatsApp: ${phone || "N/A"}`);

  if (normalizedType !== "general") {
    const priceText =
      coursePrice && Number(coursePrice)
        ? `INR ${formatAmount(coursePrice)}`
        : "N/A";
    lines.push(`Course: ${courseTitle || "N/A"}`);
    lines.push(`Listed price: ${priceText}`);
    if (paymentMethod) {
      lines.push(`Payment method: ${paymentMethod}`);
    }
  }

  return lines.join("\n");
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
        <span class="tag">${escapeHtml(course.tag || "Course")}</span>
        <h3>${escapeHtml(course.title)}</h3>
        <p>by ${escapeHtml(course.instructor)}</p>
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
      <p>We are preparing more courses for this space.</p>
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

const buildCourseSearchText = (course) =>
  `${course.title} ${course.instructor} ${course.category} ${course.tag} ${course.description}`.toLowerCase();

const renderFeaturedCourses = (sourceCourses = courseCatalog) => {
  if (!featuredCoursesGrid) return;

  if (courseCatalog.length === 0) {
    featuredCoursesGrid.innerHTML =
      '<p class="empty-courses">Courses will appear here after catalog setup.</p>';
    return;
  }

  const featuredCourses = sourceCourses.slice(0, 6);
  const placeholders = Math.max(0, 6 - featuredCourses.length);
  featuredCoursesGrid.innerHTML = [
    ...featuredCourses.map((course) => renderCourseCard(course)),
    ...Array.from({ length: placeholders }, (_, index) =>
      renderPlaceholderCard(index)
    ),
  ].join("");
};

renderFeaturedCourses();

const filterFeaturedCoursesByTopic = (topic) => {
  const keyword = String(topic || "").trim().toLowerCase();
  if (!keyword) {
    renderFeaturedCourses();
    return;
  }

  const filtered = courseCatalog.filter((course) =>
    buildCourseSearchText(course).includes(keyword)
  );

  if (filtered.length === 0) {
    renderFeaturedCourses();
    return;
  }

  renderFeaturedCourses(filtered);
};

if (year) {
  year.textContent = String(new Date().getFullYear());
}

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

const topicPillsWrap = document.querySelector("[data-topic-pills]");
const coursesSection = document.querySelector("#courses");

if (topicPillsWrap) {
  topicPillsWrap.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const link = target.closest("a");
    if (!link) return;

    event.preventDefault();
    const topic = link.dataset.topic || link.textContent || "";
    filterFeaturedCoursesByTopic(topic);

    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

const formatNumber = (value, prefix, suffix) => {
  const formatted = Math.round(value).toLocaleString("en-IN");
  return `${prefix}${formatted}${suffix}`;
};

const animateCounter = (counter) => {
  const endValue = Number(counter.dataset.countEnd || "0");
  const suffix = counter.dataset.countSuffix || "";
  const prefix = counter.dataset.countPrefix || "";
  const duration = Number(counter.dataset.countDuration || "1200");
  const startTime = performance.now();

  const step = (timestamp) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = endValue * eased;
    counter.textContent = formatNumber(current, prefix, suffix);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      counter.textContent = formatNumber(endValue, prefix, suffix);
    }
  };

  window.requestAnimationFrame(step);
};

if (counters.length > 0) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

const closeDialog = (dialog) => {
  if (!dialog) return;
  dialog.hidden = true;
  if (activeDialog === dialog) {
    activeDialog = null;
  }
  const hasVisibleDialog = Array.from(dialogs).some((item) => !item.hidden);
  if (!hasVisibleDialog) {
    document.body.classList.remove("dialog-open");
  }
};

const openDialog = (dialogName) => {
  const dialog = document.querySelector(`[data-dialog="${dialogName}"]`);
  if (!dialog) return;

  dialogs.forEach((item) => {
    item.hidden = true;
  });

  dialog.hidden = false;
  activeDialog = dialog;
  document.body.classList.add("dialog-open");

  const dialogForm = dialog.querySelector("[data-contact-form]");
  if (dialogForm) {
    dialogForm.reset();
    const defaultMethod = dialogForm.querySelector(
      'input[name="contact_method"][value="email"]'
    );
    const emailField = dialogForm.querySelector('[data-contact-field="email"]');
    const phoneField = dialogForm.querySelector('[data-contact-field="phone"]');
    const emailInput = emailField ? emailField.querySelector("input") : null;
    const phoneInput = phoneField ? phoneField.querySelector("input") : null;
    const message = dialogForm.querySelector("[data-contact-message]");

    if (defaultMethod) defaultMethod.checked = true;
    if (emailField) emailField.hidden = false;
    if (phoneField) phoneField.hidden = true;
    if (emailInput) emailInput.required = true;
    if (phoneInput) phoneInput.required = false;
    if (message) {
      message.textContent = "\u00A0";
      message.classList.remove("success", "error");
    }
  }
};

const detailsByTrack = {
  frontend: {
    outcomes: [
      "Build responsive pages and reusable UI components.",
      "Handle state, forms, and API integration confidently.",
      "Write cleaner JavaScript/React architecture.",
      "Deploy projects with production-ready setup.",
    ],
    tools: ["HTML5", "CSS3", "JavaScript", "React", "Git", "Vercel"],
    projects: [
      "Portfolio website with responsive layout",
      "Task manager with local persistence",
      "API-based dashboard with filters",
    ],
    modules: [
      {
        title: "Module 1: Foundations",
        topics: ["Semantic HTML", "CSS layout systems", "JavaScript essentials"],
      },
      {
        title: "Module 2: Components and State",
        topics: ["Reusable UI blocks", "State management", "Form workflows"],
      },
      {
        title: "Module 3: APIs and Production",
        topics: ["API integration", "Error handling", "Deployment checklist"],
      },
    ],
  },
  backend: {
    outcomes: [
      "Build secure backend services and REST APIs.",
      "Design route structure and middleware flow.",
      "Store and query data using MongoDB/SQL style workflows.",
      "Handle auth, validation, and testing basics.",
    ],
    tools: ["Node.js", "Express", "MongoDB", "Postman", "JWT", "Jest"],
    projects: [
      "Course marketplace backend API",
      "Authentication service with role access",
      "Order and payment tracking module",
    ],
    modules: [
      {
        title: "Module 1: API Fundamentals",
        topics: ["Routing", "Controllers", "Request lifecycle"],
      },
      {
        title: "Module 2: Data and Auth",
        topics: ["Database modeling", "Auth tokens", "Validation"],
      },
      {
        title: "Module 3: Quality and Scale",
        topics: ["Testing basics", "Logging", "Deployment strategy"],
      },
    ],
  },
  data: {
    outcomes: [
      "Analyze raw datasets into actionable insights.",
      "Write efficient queries and clean reporting logic.",
      "Design clear dashboards for decision making.",
      "Communicate findings using practical storytelling.",
    ],
    tools: ["Excel", "SQL", "Power BI", "Google Sheets", "Data Studio"],
    projects: [
      "Sales performance dashboard",
      "SQL reporting challenge set",
      "Business KPI tracker",
    ],
    modules: [
      {
        title: "Module 1: Data Cleaning",
        topics: ["Data types", "Missing values", "Validation rules"],
      },
      {
        title: "Module 2: Analysis Layer",
        topics: ["Excel formulas", "SQL joins", "Aggregations"],
      },
      {
        title: "Module 3: Dashboard Delivery",
        topics: ["Visualization choices", "Filters", "Insight narration"],
      },
    ],
  },
  ai: {
    outcomes: [
      "Understand Python workflow for AI tasks.",
      "Apply core machine learning concepts.",
      "Create automation scripts for repetitive work.",
      "Build beginner-friendly AI mini projects.",
    ],
    tools: ["Python", "Pandas", "NumPy", "Scikit-learn", "Jupyter"],
    projects: [
      "Prediction model starter project",
      "Automation utility scripts",
      "Data preprocessing mini pipeline",
    ],
    modules: [
      {
        title: "Module 1: Python Core",
        topics: ["Syntax refresh", "Functions", "File handling"],
      },
      {
        title: "Module 2: ML Basics",
        topics: ["Model flow", "Training concepts", "Evaluation metrics"],
      },
      {
        title: "Module 3: Applied Workflow",
        topics: ["Mini projects", "Debugging", "Packaging results"],
      },
    ],
  },
  design: {
    outcomes: [
      "Create clean, client-ready visual assets.",
      "Work with design principles and hierarchy.",
      "Prepare social and branding creatives quickly.",
      "Set a repeatable freelance delivery workflow.",
    ],
    tools: ["Figma", "Canva", "Photoshop", "Illustrator", "Color systems"],
    projects: [
      "Brand identity starter pack",
      "Social media content bundle",
      "Promotional poster campaign",
    ],
    modules: [
      {
        title: "Module 1: Design Foundations",
        topics: ["Typography", "Color", "Layout principles"],
      },
      {
        title: "Module 2: Brand Assets",
        topics: ["Logos", "Brand kits", "Templates"],
      },
      {
        title: "Module 3: Delivery Workflow",
        topics: ["Client briefs", "Revision handling", "Final exports"],
      },
    ],
  },
  prep: {
    outcomes: [
      "Improve speed and accuracy for test-style questions.",
      "Apply structured reasoning and elimination techniques.",
      "Build revision strategy with timed practice.",
      "Track weak areas and improve performance steadily.",
    ],
    tools: ["Practice sheets", "Mock tests", "Formula maps", "Revision tracker"],
    projects: [
      "Weekly mock test tracker",
      "Personal formula handbook",
      "Performance improvement plan",
    ],
    modules: [
      {
        title: "Module 1: Concepts",
        topics: ["Core theory", "Common patterns", "Shortcuts"],
      },
      {
        title: "Module 2: Practice Blocks",
        topics: ["Timed sets", "Error analysis", "Speed drills"],
      },
      {
        title: "Module 3: Final Strategy",
        topics: ["Revision planning", "Exam mindset", "Score optimization"],
      },
    ],
  },
  communication: {
    outcomes: [
      "Speak clearly in interviews and presentations.",
      "Write professional emails and profile content.",
      "Build confidence in group discussions.",
      "Develop a practical job-readiness communication system.",
    ],
    tools: ["Interview scripts", "Speaking drills", "Resume templates", "GD tasks"],
    projects: [
      "Interview answer bank",
      "Professional email toolkit",
      "Personal communication improvement plan",
    ],
    modules: [
      {
        title: "Module 1: Speaking Basics",
        topics: ["Voice clarity", "Structured responses", "Confidence cues"],
      },
      {
        title: "Module 2: Writing and Profile",
        topics: ["Email writing", "Resume language", "LinkedIn positioning"],
      },
      {
        title: "Module 3: Interview Practice",
        topics: ["Mock rounds", "Feedback loops", "Improvement actions"],
      },
    ],
  },
  notes: {
    outcomes: [
      "Revise high-value concepts faster.",
      "Use concise notes for last-minute preparation.",
      "Focus on exam-oriented and interview-oriented checkpoints.",
      "Build a repeatable daily revision routine.",
    ],
    tools: ["Curated notes", "Cheat sheets", "Mind maps", "Revision planner"],
    projects: [
      "Custom revision timetable",
      "Quick concept recap deck",
      "Exam-week priority checklist",
    ],
    modules: [
      {
        title: "Module 1: Note Navigation",
        topics: ["Section mapping", "Priority topics", "Revision tags"],
      },
      {
        title: "Module 2: Practice Usage",
        topics: ["Question mapping", "Weak-topic recovery", "Speed revision"],
      },
      {
        title: "Module 3: Final Week Plan",
        topics: ["Condensed recap", "Memory strategy", "Readiness checks"],
      },
    ],
  },
  default: {
    outcomes: [
      "Build practical, job-relevant skill confidence.",
      "Understand tools and concepts with guided flow.",
      "Practice through small real-world tasks.",
      "Follow a clear module-by-module learning path.",
    ],
    tools: ["Core tools", "Templates", "Hands-on practice assets"],
    projects: [
      "Beginner capstone task",
      "Applied practice assignment",
      "Portfolio-ready mini project",
    ],
    modules: [
      {
        title: "Module 1: Basics",
        topics: ["Concept setup", "Core understanding", "Hands-on warmup"],
      },
      {
        title: "Module 2: Applied Practice",
        topics: ["Guided exercises", "Problem solving", "Practical workflow"],
      },
      {
        title: "Module 3: Outcome Delivery",
        topics: ["Mini project", "Quality checks", "Final review"],
      },
    ],
  },
};

const getTrackDetails = (course) => {
  const categoryText = String(course?.category || "").toLowerCase();
  if (categoryText.includes("front")) return detailsByTrack.frontend;
  if (categoryText.includes("back")) return detailsByTrack.backend;
  if (categoryText.includes("data")) return detailsByTrack.data;
  if (categoryText.includes("ai")) return detailsByTrack.ai;
  if (categoryText.includes("design")) return detailsByTrack.design;
  if (categoryText.includes("aptitude")) return detailsByTrack.prep;
  if (categoryText.includes("exam")) return detailsByTrack.prep;
  if (categoryText.includes("coding")) return detailsByTrack.prep;
  if (categoryText.includes("career")) return detailsByTrack.communication;
  if (categoryText.includes("communication")) return detailsByTrack.communication;
  if (categoryText.includes("notes")) return detailsByTrack.notes;
  return detailsByTrack.default;
};

const renderSimpleList = (items) =>
  items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

const renderModuleList = (modules) =>
  modules
    .map(
      (module, index) => `
      <article class="course-module-item">
        <h4>${index + 1}. ${escapeHtml(module.title)}</h4>
        <p>${escapeHtml(module.topics.join(" | "))}</p>
      </article>
    `
    )
    .join("");

const COURSE_WIZARD_STEPS = [
  "Learning and Projects",
  "Topics and Course Length",
  "Creator and Pricing",
  "Payment and Direct Contact",
];
const COURSE_WIZARD_TOTAL_STEPS = COURSE_WIZARD_STEPS.length;
let courseWizardStep = 0;

const setCourseWizardStep = (nextStep) => {
  if (!courseDetailsContent) return;
  const wizard = courseDetailsContent.querySelector("[data-course-wizard]");
  if (!wizard) return;

  const clampedStep = Math.max(
    0,
    Math.min(Number(nextStep), COURSE_WIZARD_TOTAL_STEPS - 1)
  );
  courseWizardStep = clampedStep;
  wizard.style.setProperty("--wizard-step", String(clampedStep));

  const stepIndicator = wizard.querySelector("[data-step-indicator]");
  const stepCurrentTitle = wizard.querySelector("[data-step-current-title]");
  if (stepIndicator) {
    stepIndicator.textContent = `${clampedStep + 1} / ${COURSE_WIZARD_TOTAL_STEPS}`;
  }
  if (stepCurrentTitle) {
    stepCurrentTitle.textContent = COURSE_WIZARD_STEPS[clampedStep];
  }

  const previousButton = wizard.querySelector('[data-step-nav="prev"]');
  const nextButton = wizard.querySelector('[data-step-nav="next"]');
  if (previousButton instanceof HTMLButtonElement) {
    previousButton.disabled = clampedStep === 0;
  }
  if (nextButton instanceof HTMLButtonElement) {
    nextButton.disabled = clampedStep === COURSE_WIZARD_TOTAL_STEPS - 1;
  }

  wizard.querySelectorAll("[data-step-dot]").forEach((dot, index) => {
    dot.classList.toggle("active", index === clampedStep);
  });
  wizard.querySelectorAll("[data-step-label]").forEach((label, index) => {
    label.classList.toggle("active", index === clampedStep);
  });
};

const renderCourseDetailsDialog = (course) => {
  if (!courseDetailsContent || !courseDetailsTitle) return;

  const selectedTrack = getTrackDetails(course);
  const customDetails = course.details || {};
  const outcomes =
    Array.isArray(customDetails.outcomes) && customDetails.outcomes.length > 0
      ? customDetails.outcomes
      : selectedTrack.outcomes;
  const tools =
    Array.isArray(customDetails.tools) && customDetails.tools.length > 0
      ? customDetails.tools
      : selectedTrack.tools;
  const projects =
    Array.isArray(customDetails.projects) && customDetails.projects.length > 0
      ? customDetails.projects
      : selectedTrack.projects;
  const modules =
    Array.isArray(customDetails.modules) && customDetails.modules.length > 0
      ? customDetails.modules
      : selectedTrack.modules;

  const originalPrice = Number(course.mrp || 0);
  const ourPrice = Number(course.price || 0);
  const savings = Math.max(originalPrice - ourPrice, 0);
  const estimatedLessons = Math.max(modules.length * 5, 12);
  const estimatedHours = Math.max(modules.length * 4, 20);
  const isFree =
    course.priceLabel?.toLowerCase() === "free" || Number(course.price) === 0;
  const priceDisplay = course.priceLabel
    ? escapeHtml(course.priceLabel)
    : `&#8377;${formatAmount(ourPrice)}`;
  const mrpDisplay = course.mrpLabel
    ? escapeHtml(course.mrpLabel)
    : course.mrp
      ? `&#8377;${formatAmount(originalPrice)}`
      : "";
  const mrpLabel = course.mrpLabel ? "Access" : "Original Price";
  const showSavings = Boolean(course.mrp && originalPrice > ourPrice);

  courseDetailsTitle.textContent = String(course.title || "Course Details");
  if (courseDetailsSubtitle) {
    courseDetailsSubtitle.textContent = `By ${course.instructor} | ${course.category}`;
  }

  courseDetailsContent.innerHTML = `
    <section class="course-wizard" data-course-wizard style="--wizard-step: 0;">
      <div class="course-wizard-top">
        <div class="course-step-heading">
          <p class="course-step-kicker">Interactive Course Overview</p>
          <h3 class="course-step-current-title" data-step-current-title>${COURSE_WIZARD_STEPS[0]}</h3>
        </div>
        <div class="course-step-status">
          <p class="course-step-indicator" data-step-indicator>1 / ${COURSE_WIZARD_TOTAL_STEPS}</p>
          <div class="course-step-dots" aria-hidden="true">
            <span class="course-step-dot active" data-step-dot="0"></span>
            <span class="course-step-dot" data-step-dot="1"></span>
            <span class="course-step-dot" data-step-dot="2"></span>
            <span class="course-step-dot" data-step-dot="3"></span>
          </div>
        </div>
      </div>

      <div class="course-step-labels">
        <button type="button" class="course-step-label active" data-step-label="0">Learning</button>
        <button type="button" class="course-step-label" data-step-label="1">Topics</button>
        <button type="button" class="course-step-label" data-step-label="2">Pricing</button>
        <button type="button" class="course-step-label" data-step-label="3">Payment</button>
      </div>

      <div class="course-wizard-viewport">
        <div class="course-wizard-track">
          <section class="course-wizard-slide" aria-label="Learning outcomes and projects">
            <article class="course-wizard-card">
              <h3>What you will learn</h3>
              <p>${escapeHtml(course.description || "Course overview available in full detail.")}</p>
              <ul class="course-detail-list course-bullets">
                ${renderSimpleList(outcomes)}
              </ul>
            </article>

            <article class="course-wizard-card">
              <h3>Projects you will create</h3>
              <ul class="course-detail-list course-bullets">
                ${renderSimpleList(projects)}
              </ul>
            </article>
          </section>

          <section class="course-wizard-slide" aria-label="Topics and course length">
            <article class="course-wizard-card">
              <h3>Topics and Module Flow</h3>
              <div class="course-modules-grid">
                ${renderModuleList(modules)}
              </div>
            </article>

            <article class="course-wizard-card">
              <h3>Course Length and Coverage</h3>
              <div class="course-meta-grid">
                <div class="course-meta-item">
                  <span>Course Length</span>
                  <strong>${escapeHtml(course.duration || "Self-paced")}</strong>
                </div>
                <div class="course-meta-item">
                  <span>Total Modules</span>
                  <strong>${modules.length}</strong>
                </div>
                <div class="course-meta-item">
                  <span>Estimated Lessons</span>
                  <strong>${estimatedLessons}+</strong>
                </div>
                <div class="course-meta-item">
                  <span>Practice Hours</span>
                  <strong>${estimatedHours}+ hrs</strong>
                </div>
              </div>
            </article>
          </section>

          <section class="course-wizard-slide" aria-label="Creator and pricing details">
            <article class="course-wizard-card">
              <h3>Original Creator</h3>
              <p class="creator-row">
                Original Creator: <strong>${escapeHtml(course.instructor)}</strong>
              </p>
              <p class="creator-row">
                Category: <strong>${escapeHtml(course.category)}</strong>
              </p>
            </article>

            <article class="course-wizard-card">
              <h3>Price Comparison</h3>
              ${
                mrpDisplay
                  ? `
              <div class="course-price-row">
                <span>${escapeHtml(mrpLabel)}</span>
                <strong>${mrpDisplay}</strong>
              </div>
              `
                  : ""
              }
              <div class="course-price-row">
                <span>Our Price</span>
                <strong class="our-price">${priceDisplay}</strong>
              </div>
              ${
                showSavings
                  ? `<p class="course-savings">You save &#8377;${formatAmount(
                      savings
                    )}</p>`
                  : ""
              }
            </article>

            <article class="course-wizard-card">
              <h3>Tools and Concepts Covered</h3>
              <div class="course-chip-list">
                ${tools.map((tool) => `<span>${escapeHtml(tool)}</span>`).join("")}
              </div>
            </article>
          </section>

          <section class="course-wizard-slide" aria-label="Payment and direct contact">
            ${
              isFree
                ? `
            <article class="course-wizard-card course-payment-card">
              <div class="payment-head">
                <span class="payment-badge">Free Access</span>
                <h3>Get Your Notes</h3>
              </div>
              <p>
                Enter your email address. We will share the course notes directly to your inbox.
              </p>
              <form class="free-course-form" data-free-course-form>
                <label class="free-course-field">
                  <span>Email Address</span>
                  <input
                    type="email"
                    name="free_email"
                    placeholder="Enter your email"
                    autocomplete="email"
                    required
                  />
                </label>
                <button type="submit" class="solid-btn free-course-btn">
                  Get Free Access
                </button>
                <p class="free-course-message" data-free-message aria-live="polite">
                  &nbsp;
                </p>
              </form>
              <div class="free-course-contact">
                <a
                  class="whatsapp-link"
                  href="https://wa.me/919518816505"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 4a7 7 0 0 0-6.1 10.4L5 20l5.7-1.6A7 7 0 1 0 12 4Zm0 12.7c-1.2 0-2.3-.3-3.2-.9l-.2-.1-3.4 1 1-3.3-.1-.2a5.7 5.7 0 1 1 10.1 1.2c-1 1.4-2.7 2.3-4.8 2.3Zm3.4-4.6c-.2-.1-1.2-.6-1.4-.7-.2-.1-.4-.1-.6.1l-.5.7c-.1.2-.2.2-.4.1-.2-.1-.7-.3-1.3-.9-.5-.5-.9-1.1-1-1.3-.1-.2 0-.3.1-.4l.3-.4.2-.3c.1-.1.1-.3 0-.4l-.6-1.4c-.1-.3-.3-.2-.4-.2h-.5c-.1 0-.3 0-.4.2-.1.2-.6.6-.6 1.5s.6 1.8.7 1.9c.1.1 1.2 1.8 2.9 2.5.4.2.7.3 1 .4.4.1.7.1 1 .1.3 0 .8-.3.9-.6.1-.3.1-.5.1-.6 0-.1-.2-.2-.4-.3Z"
                    />
                  </svg>
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </article>
            `
                : `
            <article class="course-wizard-card course-payment-card">
              <div class="payment-head">
                <span class="payment-badge">Secure Checkout</span>
                <h3>Payment and Enrollment</h3>
              </div>
              <p>
                Complete payment and get verified course access details on your preferred contact method.
              </p>
              <div class="payment-summary">
                <div class="payment-summary-item">
                  <span>Course Fee</span>
                  <strong>&#8377;${formatAmount(ourPrice)}</strong>
                </div>
              </div>
              <div class="upi-request">
                <h4>Pay via UPI</h4>
                <p>
                  Share your email or WhatsApp number so we can confirm the
                  payment request and send you access details.
                </p>
                <form
                  class="upi-form"
                  data-upi-form
                  data-course-title="${escapeHtml(course.title)}"
                  data-course-price="${ourPrice}"
                >
                  <fieldset class="contact-method upi-method">
                    <legend>Contact Method</legend>
                    <label class="contact-method-option">
                      <input
                        type="radio"
                        name="upi_contact_method"
                        value="email"
                        checked
                        required
                      />
                      <span>Email</span>
                    </label>
                    <label class="contact-method-option">
                      <input
                        type="radio"
                        name="upi_contact_method"
                        value="phone"
                        required
                      />
                      <span>WhatsApp Number</span>
                    </label>
                  </fieldset>

                  <label class="form-field" data-upi-field="email">
                    <span>Email Address</span>
                    <input
                      type="email"
                      name="upi_email"
                      placeholder="Enter your email"
                      autocomplete="email"
                      required
                    />
                  </label>

                  <label class="form-field" data-upi-field="phone" hidden>
                    <span>WhatsApp Number</span>
                    <input
                      type="tel"
                      name="upi_phone"
                      placeholder="Enter your WhatsApp number"
                      inputmode="numeric"
                      pattern="[0-9]{10}"
                    />
                  </label>

                  <button type="submit" class="solid-btn pay-now-btn">
                    Generate UPI QR
                  </button>
                  <p class="upi-status" data-upi-status aria-live="polite">
                    &nbsp;
                  </p>
                </form>

                <div class="upi-qr-wrap" data-upi-qr-wrap hidden>
                  <div class="upi-qr" data-upi-qr-code></div>
                  <div class="upi-qr-meta">
                    <p class="upi-qr-note">
                      Scan the QR or open your UPI app to pay the exact course fee.
                    </p>
                    <a class="solid-btn upi-link" data-upi-link target="_blank"
                      >Open UPI App</a
                    >
                  </div>
                </div>
              </div>
              <div class="payment-actions">
                <a
                  class="whatsapp-link whatsapp-pay-link"
                  href="https://wa.me/919518816505"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 4a7 7 0 0 0-6.1 10.4L5 20l5.7-1.6A7 7 0 1 0 12 4Zm0 12.7c-1.2 0-2.3-.3-3.2-.9l-.2-.1-3.4 1 1-3.3-.1-.2a5.7 5.7 0 1 1 10.1 1.2c-1 1.4-2.7 2.3-4.8 2.3Zm3.4-4.6c-.2-.1-1.2-.6-1.4-.7-.2-.1-.4-.1-.6.1l-.5.7c-.1.2-.2.2-.4.1-.2-.1-.7-.3-1.3-.9-.5-.5-.9-1.1-1-1.3-.1-.2 0-.3.1-.4l.3-.4.2-.3c.1-.1.1-.3 0-.4l-.6-1.4c-.1-.3-.3-.2-.4-.2h-.5c-.1 0-.3 0-.4.2-.1.2-.6.6-.6 1.5s.6 1.8.7 1.9c.1.1 1.2 1.8 2.9 2.5.4.2.7.3 1 .4.4.1.7.1 1 .1.3 0 .8-.3.9-.6.1-.3.1-.5.1-.6 0-.1-.2-.2-.4-.3Z"
                    />
                  </svg>
                  <span>WhatsApp Support</span>
                </a>
              </div>
            </article>
            `
            }

            <article class="course-wizard-card">
              <h3>Direct Contact</h3>
              <div class="course-direct-links">
                <p>Reach us directly if you need quick help.</p>
                <div class="dialog-contact-icons">
                  <a
                    class="icon-link"
                    href="tel:+919518816505"
                    aria-label="Call +91 95188 16505"
                    title="+91 95188 16505"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M6.7 3.3 9.2 2l3 4.4-2.2 2.2a14.9 14.9 0 0 0 5.4 5.4l2.2-2.2 4.4 3-1.3 2.5a2.4 2.4 0 0 1-2.5 1.3c-7.2-1.2-12.8-6.8-14-14a2.4 2.4 0 0 1 1.3-2.3Z"
                      />
                    </svg>
                  </a>
                  <a
                    class="icon-link"
                    href="mailto:iamharshindian015@gmail.com"
                    aria-label="Email iamharshindian015@gmail.com"
                    title="iamharshindian015@gmail.com"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m4 7 8 6 8-6" />
                    </svg>
                  </a>
                  <a
                    class="icon-link"
                    href="https://www.instagram.com/harshxindian"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram @harshxindian"
                    title="@harshxindian"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4.2" />
                      <circle cx="17.3" cy="6.7" r="1.1" />
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>

      <div class="course-dialog-nav">
        <button type="button" class="course-nav-btn" data-step-nav="prev" disabled>
          &larr; Previous
        </button>
        <p class="course-nav-note">Use left and right arrows to move sections</p>
        <button type="button" class="course-nav-btn" data-step-nav="next">
          Next &rarr;
        </button>
      </div>
    </section>
  `;

  setCourseWizardStep(0);
};

const openCourseDialog = (courseId) => {
  const selectedCourse = courseCatalog.find(
    (course) => String(course.id) === String(courseId)
  );
  if (!selectedCourse || !courseDetailsDialog) return;
  renderCourseDetailsDialog(selectedCourse);
  openDialog("course-details-dialog");
  setCourseWizardStep(0);
};

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const dialogOpener = target.closest("[data-dialog-open]");
  if (dialogOpener instanceof HTMLElement) {
    const dialogName = dialogOpener.dataset.dialogOpen;
    if (dialogName) {
      event.preventDefault();
      if (dialogName === "contact-dialog") {
        setContactDialogContext({
          titleText: "We will contact you ASAP",
          requestType: "general",
          courseTitle: "",
          coursePrice: "",
          paymentMethod: "",
        });
      }
      openDialog(dialogName);
      return;
    }
  }

  const stepNavigationButton = target.closest("[data-step-nav]");
  if (stepNavigationButton instanceof HTMLElement) {
    event.preventDefault();
    const direction = stepNavigationButton.dataset.stepNav;
    if (direction === "next") {
      setCourseWizardStep(courseWizardStep + 1);
    }
    if (direction === "prev") {
      setCourseWizardStep(courseWizardStep - 1);
    }
    return;
  }

  const stepLabelButton = target.closest("[data-step-label]");
  if (stepLabelButton instanceof HTMLElement) {
    event.preventDefault();
    const jumpStep = Number(stepLabelButton.dataset.stepLabel);
    if (!Number.isNaN(jumpStep)) {
      setCourseWizardStep(jumpStep);
    }
    return;
  }

  const detailsTrigger = target.closest("[data-view-course]");
  if (detailsTrigger instanceof HTMLElement) {
    const courseId = detailsTrigger.dataset.viewCourse;
    if (courseId) {
      event.preventDefault();
      openCourseDialog(courseId);
      return;
    }
  }

  const purchaseButton = target.closest("[data-purchase-course]");
  if (purchaseButton instanceof HTMLElement) {
    const courseId = purchaseButton.dataset.purchaseCourse;
    const selectedCourse = courseCatalog.find(
      (course) => String(course.id) === String(courseId)
    );
    event.preventDefault();
    setContactDialogContext({
      titleText: "Course Purchase Request",
      requestType: "course",
      courseTitle: selectedCourse?.title || "",
      coursePrice: selectedCourse?.price ? String(selectedCourse.price) : "",
      paymentMethod: "UPI (manual verification)",
    });
    openDialog("contact-dialog");

    const contactMessage = document.querySelector(
      '[data-dialog="contact-dialog"] [data-contact-message]'
    );
    if (contactMessage && selectedCourse) {
      contactMessage.textContent = `Selected course: ${selectedCourse.title}. Share your contact details to continue purchase.`;
      contactMessage.classList.remove("success", "error");
    }
  }

});

if (dialogs.length > 0) {
  dialogs.forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeDialog(dialog);
      }
    });

    dialog.querySelectorAll("[data-dialog-close]").forEach((closeButton) => {
      closeButton.addEventListener("click", () => closeDialog(dialog));
    });
  });

  document.addEventListener("keydown", (event) => {
    if (activeDialog?.dataset.dialog === "course-details-dialog") {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setCourseWizardStep(courseWizardStep + 1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCourseWizardStep(courseWizardStep - 1);
        return;
      }
    }

    if (event.key === "Escape" && activeDialog) {
      closeDialog(activeDialog);
    }
  });
}

if (contactForm) {
  const methodRadios = contactForm.querySelectorAll(
    'input[name="contact_method"]'
  );
  const emailField = contactForm.querySelector('[data-contact-field="email"]');
  const phoneField = contactForm.querySelector('[data-contact-field="phone"]');
  const emailInput = emailField ? emailField.querySelector("input") : null;
  const phoneInput = phoneField ? phoneField.querySelector("input") : null;
  const message = contactForm.querySelector("[data-contact-message]");
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const submitButtonLabel = submitButton ? submitButton.textContent : "Submit";

  const resetMessage = () => {
    if (!message) return;
    message.textContent = "\u00A0";
    message.classList.remove("success", "error");
  };

  const updateContactField = () => {
    const selectedMethod =
      contactForm.querySelector('input[name="contact_method"]:checked')
        ?.value || "email";
    const useEmail = selectedMethod === "email";

    if (emailField) emailField.hidden = !useEmail;
    if (phoneField) phoneField.hidden = useEmail;
    if (emailInput) emailInput.required = useEmail;
    if (phoneInput) phoneInput.required = !useEmail;
  };

  methodRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      updateContactField();
      resetMessage();
    });
  });

  contactForm.querySelectorAll("input, select").forEach((field) => {
    field.addEventListener("input", resetMessage);
    field.addEventListener("change", resetMessage);
  });

  updateContactField();

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    updateContactField();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      if (message) {
        message.textContent = "Please fill all required fields correctly.";
        message.classList.remove("success");
        message.classList.add("error");
      }
      return;
    }

    const selectedMethod =
      contactForm.querySelector('input[name="contact_method"]:checked')
        ?.value || "email";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    if (message) {
      message.textContent = "Sending your details...";
      message.classList.remove("error", "success");
    }

    initEmailJs();
    if (!emailJsReady) {
      if (message) {
        message.textContent =
          "Email service not ready. Please refresh and try again.";
        message.classList.remove("success");
        message.classList.add("error");
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButtonLabel;
      }
      return;
    }

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());
    const contactValue =
      selectedMethod === "phone" ? payload.phone || "" : payload.email || "";
    const requestType = payload.request_type || "general";
    const courseTitle = payload.course_title || "";
    const coursePrice = payload.course_price || "";
    const paymentMethod = payload.payment_method || "";
    const messageSubject =
      requestType === "general"
        ? "Contact request - ScholarShayata"
        : `Course request - ${courseTitle || "ScholarShayata"}`;
    const messageBody = buildContactMessageBody({
      requestType,
      name: payload.name || "",
      gender: payload.gender || "",
      contactMethod: selectedMethod,
      email: payload.email || "",
      phone: payload.phone || "",
      courseTitle,
      coursePrice,
      paymentMethod,
    });

    try {
      const templateId =
        requestType === "general"
          ? EMAILJS_TEMPLATE_ID
          : EMAILJS_PAYMENT_TEMPLATE_ID;
      await window.emailjs.send(EMAILJS_SERVICE_ID, templateId, {
        form_title: payload.form_title || "We will contact you ASAP",
        name: payload.name || "",
        gender: payload.gender || "",
        contact_method: selectedMethod,
        email: payload.email || "",
        phone: payload.phone || "",
        contact_value: contactValue,
        request_type: requestType,
        course_title: courseTitle,
        course_price: coursePrice,
        payment_method: paymentMethod,
        message_subject: messageSubject,
        message_body: messageBody,
      });

      if (message) {
        message.textContent =
          selectedMethod === "phone"
            ? "Thanks. We received your details and will contact you on WhatsApp soon."
            : "Thanks. We received your details and will contact you by email soon.";
        message.classList.remove("error");
        message.classList.add("success");
      }

      contactForm.reset();
      const defaultMethod = contactForm.querySelector(
        'input[name="contact_method"][value="email"]'
      );
      if (defaultMethod) {
        defaultMethod.checked = true;
      }
      updateContactField();
    } catch (error) {
      if (message) {
        message.textContent =
          error?.text || error?.message || "Something went wrong. Please try again.";
        message.classList.remove("success");
        message.classList.add("error");
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButtonLabel;
      }
    }
  });
}

const updateUpiContactField = (form) => {
  const selectedMethod =
    form.querySelector('input[name="upi_contact_method"]:checked')?.value ||
    "email";
  const useEmail = selectedMethod === "email";
  const emailField = form.querySelector('[data-upi-field="email"]');
  const phoneField = form.querySelector('[data-upi-field="phone"]');
  const emailInput = emailField ? emailField.querySelector("input") : null;
  const phoneInput = phoneField ? phoneField.querySelector("input") : null;

  if (emailField) emailField.hidden = !useEmail;
  if (phoneField) phoneField.hidden = useEmail;
  if (emailInput) emailInput.required = useEmail;
  if (phoneInput) phoneInput.required = !useEmail;
};

const buildUpiLink = (courseTitle, amount) => {
  const numericAmount = Number(amount || 0).toFixed(2);
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_RECEIVER_NAME,
    am: numericAmount,
    cu: "INR",
    tn: courseTitle,
  });
  return `upi://pay?${params.toString()}`;
};

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const form = target.closest("[data-upi-form]");
  if (!form) return;
  if (
    target.matches('input[name="upi_contact_method"]') ||
    target.closest('input[name="upi_contact_method"]')
  ) {
    updateUpiContactField(form);
  }
});

document.addEventListener("submit", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLFormElement)) return;
  if (target.matches("[data-upi-form]")) {
    event.preventDefault();
    updateUpiContactField(target);

    const status = target.querySelector("[data-upi-status]");
    const qrWrap = target.parentElement?.querySelector("[data-upi-qr-wrap]");
    const qrCode = qrWrap ? qrWrap.querySelector("[data-upi-qr-code]") : null;
    const upiLinkEl = qrWrap ? qrWrap.querySelector("[data-upi-link]") : null;

    if (!UPI_ID) {
      if (status) {
        status.textContent = "UPI ID is not configured yet.";
        status.classList.remove("success");
        status.classList.add("error");
      }
      return;
    }

    if (!target.checkValidity()) {
      target.reportValidity();
      if (status) {
        status.textContent = "Please enter a valid email or WhatsApp number.";
        status.classList.remove("success");
        status.classList.add("error");
      }
      return;
    }

    initEmailJs();
    if (!emailJsReady) {
      if (status) {
        status.textContent =
          "Email service not ready. Please refresh and try again.";
        status.classList.remove("success");
        status.classList.add("error");
      }
      return;
    }

    const courseTitle = target.dataset.courseTitle || "Course";
    const coursePrice = target.dataset.coursePrice || "0";
    const selectedMethod =
      target.querySelector('input[name="upi_contact_method"]:checked')?.value ||
      "email";
    const emailValue = target.querySelector('input[name="upi_email"]')?.value || "";
    const phoneValue = target.querySelector('input[name="upi_phone"]')?.value || "";
    const contactValue = selectedMethod === "phone" ? phoneValue : emailValue;
    const upiLink = buildUpiLink(courseTitle, coursePrice);
    const messageSubject = `UPI Payment Request - ${courseTitle}`;
    const messageBody = buildContactMessageBody({
      requestType: "payment",
      name: "",
      gender: "",
      contactMethod: selectedMethod,
      email: emailValue,
      phone: phoneValue,
      courseTitle,
      coursePrice,
      paymentMethod: "UPI",
    });

    if (qrWrap && qrCode) {
      qrCode.innerHTML = "";
      if (window.QRCode) {
        new window.QRCode(qrCode, {
          text: upiLink,
          width: 180,
          height: 180,
          colorDark: "#1d1236",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      }
      qrWrap.hidden = false;
    }

    if (upiLinkEl) {
      upiLinkEl.setAttribute("href", upiLink);
    }

    window.emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_PAYMENT_TEMPLATE_ID, {
        form_title: "UPI Payment Request",
        course_title: courseTitle,
        course_price: coursePrice,
        contact_method: selectedMethod,
        contact_value: contactValue,
        email: emailValue,
        phone: phoneValue,
        request_type: "payment",
        payment_method: "UPI",
        message_subject: messageSubject,
        message_body: messageBody,
      })
      .then(() => {
        if (status) {
          status.textContent =
            "Request received. Please pay the exact amount shown.";
          status.classList.remove("error");
          status.classList.add("success");
        }
      })
      .catch((error) => {
        if (status) {
          status.textContent =
            error?.text || "Unable to send request. Please try again.";
          status.classList.remove("success");
          status.classList.add("error");
        }
      });
    return;
  }
  if (!target.matches("[data-free-course-form]")) return;

  event.preventDefault();
  const message = target.querySelector("[data-free-message]");

  if (!target.checkValidity()) {
    target.reportValidity();
    if (message) {
      message.textContent = "Please enter a valid email address.";
      message.classList.remove("success");
      message.classList.add("error");
    }
    return;
  }

  if (message) {
    message.textContent =
      "Thanks for requesting this free course. Check your inbox, we delivered the notes.";
    message.classList.remove("error");
    message.classList.add("success");
  }

  target.reset();
});
