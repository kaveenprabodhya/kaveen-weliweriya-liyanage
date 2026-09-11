/**
 * Content for every window in the portfolio.
 * Edit this file to change what appears on the site — nothing else needs touching.
 * Anything marked TODO is a placeholder waiting on real content.
 */
const SITE = {
  person: {
    name: "Kaveen Prabodhya Thivanka Liyanage Weliweriya Liyanage",
    shortName: "Kaveen Weliweriya Liyanage",
    tagline: "Applied AI researcher — Affective Computing, User Modelling, Generative AI & LLMs, AI Personalisation, NLP, Multi-Agent Systems",
    computerName: "KAVEEN-PC",
  },

  welcomeNote: {
    title: "Start Here",
    body: "I’m an Applied AI researcher at the University of Warwick, exploring affective computing, personalised AI, and multi-agent systems, with a foundation in Java and Spring engineering.",
  },

  cv: {
    // Shown inside the System Properties-style dialog (My Computer > Properties)
    general: {
      headline: "Applied AI researcher — Affective Computing, User Modelling, Generative AI & LLMs, AI Personalisation, NLP, Multi-Agent Systems",
      registeredTo: "MSc Applied Artificial Intelligence — University of Warwick (WMG Excellence Scholar)",
      computer: "Coventry, UK",
      extra: "Expected graduation: Jan 2027",
    },
    education: [
      {
        degree: "MSc Applied Artificial Intelligence",
        place: "University of Warwick (WMG) — Excellence Scholar",
        period: "Sep 2025 – Sep 2026",
        modules: "AI & Deep Learning, Programming for AI, Applied Statistics for AI, AI & Data Mining, AI for Industry, Ethical AI Implementation, MSc Project",
      },
      {
        degree: "BSc (Hons) Computing — First Class",
        place: "National Institute of Business Management, Sri Lanka (Coventry University)",
        period: "Jun 2022 – Jun 2024",
        modules: "UX Design I & II, Data & Information Retrieval, Data Structures & Algorithms, iOS Development, Agile Development, Web API Development, AI & HCI, BSc Project",
      },
    ],
    awards: [
      {
        name: "WMG Excellence Scholarship",
        place: "WMG, University of Warwick",
        period: "Jun 2025",
        note: "Merit-based scholarship recognising academic achievement, leadership potential and professional excellence.",
      },
      {
        name: "Dean's List Award",
        place: "NIBM Sri Lanka, in partnership with Coventry University",
        period: "Jul 2024",
        note: "For the most outstanding academic performance in BSc (Hons) Computing.",
      },
    ],
    skills: [
      "Applied AI Research — Affective Computing, User Modelling, AI Personalisation, NLP, Multi-Agent Systems, Computational Experimentation",
      "Generative AI & LLMs — Prompting, Multi-Agent Systems, Evaluation, RAG and Model-Driven Workflows",
      "ML & Deep Learning — PyTorch, TensorFlow, scikit-learn, CNNs, LSTMs, Transformers",
      "AI Evaluation & Interpretability — Statistical Testing, SHAP, LIME, Robustness and Error Analysis",
      "Responsible AI — Algorithmic Auditing, Bias & Fairness Evaluation, AI Governance",
      "Research Engineering & MLOps — Python, Docker, Git, MLflow, AWS SageMaker, Azure ML",
      "Software Engineering Foundation — Java, Spring Boot, REST, Security, WebFlux, Spring Cloud, Kafka, JMS, CircleCI, Angular & React",
    ],
    file: {
      name: "Kaveen-Weliweriya-Liyanage-CV.pdf",
      href: "assets/cv/Kaveen-Weliweriya-Liyanage-CV.pdf",
    },
  },

  research: {
    folderTitle: "Research",
    items: [
      {
        icon: "doc",
        name: "Affective Sonic Agents for Emotion Alignment",
        summary:
`MSc Dissertation, University of Warwick — Jun 2026 to Sep 2026

A multi-agent generative AI framework that measures alignment between
brand-intended and audience-perceived emotion in synthetic sonic logos,
using valence-arousal modelling and OCEAN-based synthetic audience agents.

Designed and ran controlled computational experiments on synthetic
data — statistical analysis and distance-based metrics to evaluate
emotional alignment, persona-dependent variation and inter-agent
disagreement.

Full pipeline, stimuli gallery and write-up are linked below.`,
        link: "https://github.com/kaveenprabodhya/affective-sonic-agents-for-emotion-alignment",
      },
      {
        icon: "doc",
        name: "Emotionally Resonant Branding",
        summary:
`BSc Dissertation, NIBM Sri Lanka / Coventry University — Jan 2023 to Apr 2024

An AI branding prototype combining facial-emotion recognition,
emotion-colour mapping and generative AI to create dynamic
brand-image concepts from audience emotional responses.

Ran an empirical study with 191 participants (survey design + SPSS)
evaluating system usefulness, trust, acceptance and ethical concerns.
Published in the Open Journal of Applied Sciences — see Publications.`,
        link: "https://github.com/kaveenprabodhya/reso-brand-alchemy-fyp",
      },
    ],
  },

  publications: {
    folderTitle: "Publications",
    items: [
      {
        icon: "doc",
        type: "Journal Article",
        year: "2024",
        title: "Emotionally Resonant Branding: The Role of AI in Synthesising Dynamic Brand Images for Artists in the Music Industry",
        name: "Emotionally Resonant Branding (2024)",
        authors: "Kaveen Liyanage · Heshan Balalle",
        venue: "Open Journal of Applied Sciences · Volume 14 · pp. 2661–2678",
        contribution: "An affective-computing branding study combining facial-emotion recognition, emotion–colour mapping and generative AI, evaluated through an empirical study with 191 participants.",
        doi: "10.4236/ojapps.2024.149175",
        link: "https://doi.org/10.4236/ojapps.2024.149175",
        code: "https://github.com/kaveenprabodhya/reso-brand-alchemy-fyp",
        research: "research",
        metrics: ["Published", "Peer reviewed", "7 citations"],
      },
    ],
  },

  workExperience: {
    folderTitle: "Work Experience",
    items: [],
  },

  projects: {
    folderTitle: "Projects",
    categories: [
      {
        name: "Research & Applied AI",
        items: [
          { icon: "exe", name: "Affective Sonic Agents for Emotion Alignment", summary: "Warwick MSc research system for controlled sonic-logo generation, independent emotion judging and OCEAN-conditioned synthetic audience evaluation.", page: "projects/affective-sonic-agents.html", link: "https://github.com/kaveenprabodhya/affective-sonic-agents-for-emotion-alignment" },
          { icon: "exe", name: "Emotionally Resonant Branding", summary: "Full-stack affective branding prototype combining generative imagery, facial-emotion inference and a 191-participant empirical study.", page: "projects/emotionally-resonant-branding.html", link: "https://github.com/kaveenprabodhya/reso-brand-alchemy-fyp" },
        ],
      },
      {
        name: "Machine Learning & NLP",
        items: [
          { icon: "exe", name: "StudentPulse — Academic Risk Navigator", summary: "Held-out XGBoost pipeline for four-class academic-risk prediction over 32,593 student records, with explicit overfitting and per-class analysis.", page: "projects/studentpulse.html", link: "https://github.com/kaveenprabodhya/StudentPulse---Academic-Risk-Navigator" },
          { icon: "exe", name: "Amazon Electronics Sentiment Analysis", summary: "Controlled NLP study comparing TF-IDF classical models with Word2Vec deep sequence models under shared preprocessing and held-out evaluation.", page: "projects/amazon-sentiment.html", link: "https://github.com/kaveenprabodhya/comparative_analysis_of_amazon_electronics_reviews" },
          { icon: "exe", name: "Diabetes Discovery", summary: "CDC public-health modelling study combining supervised prediction, tuning, explainability, clustering and association analysis over 250k+ records.", page: "projects/diabetes-discovery.html", link: "https://github.com/kaveenprabodhya/Diabetes-Discovery-ML-Project" },
        ],
      },
      {
        name: "Data, Algorithms & Architecture",
        items: [
          { icon: "exe", name: "Market Basket Analyser", summary: "Graph-based transaction analytics toolkit with frequent-pattern mining, recommendations, BFS/DFS, interactive visualisation and automated tests.", page: "projects/market-basket.html", link: "https://github.com/kaveenprabodhya/Project-Market-Basket-Analyser" },
          { icon: "exe", name: "Public Health Data Insights Platform", summary: "Layered Python desktop system separating UI, controllers, services, repositories and SQLite data infrastructure with automated testing.", page: "projects/eda-platform.html", link: "https://github.com/kaveenprabodhya/Project-EDA-Platform" },
        ],
      },
      {
        name: "Java & Spring Systems Engineering",
        items: [
          { icon: "exe", name: "PSPIMS — Operations Management System", summary: "Full-stack Spring Boot and Angular system connecting procurement, production, inventory, sales, shipping and payment workflows.", page: "projects/pspims-backend.html", link: "https://github.com/kaveenprabodhya/pspims-project-back-end" },
          { icon: "exe", name: "Kafka & Elasticsearch Event Platform", summary: "Event-driven Spring system with Kafka/Avro ingestion, Elasticsearch indexing, blocking/reactive query services, Keycloak and container orchestration.", page: "projects/kafka-elastic.html", link: "https://github.com/kaveenprabodhya/event-driven-microservices-kafka-elastic-project" },
          { icon: "exe", name: "Spring Security Brewery", summary: "Spring Boot security case study covering protected MVC/REST routes, Basic authentication, custom header authentication, BCrypt and security-aware integration tests.", page: "projects/spring-security.html", link: "https://github.com/kaveenprabodhya/spring-security-demo" },
          { icon: "exe", name: "Spring Pet Clinic — CircleCI", summary: "Layered Spring Boot clinic system with Spring MVC, Data JPA, Thymeleaf, automated tests and a CircleCI build-then-test continuous-integration pipeline.", page: "projects/spring-pet-clinic-ci.html", link: "https://github.com/kaveenprabodhya/pet-clinic-spring-practice" },
          { icon: "exe", name: "Spring WebFlux Reactive REST API", summary: "Non-blocking REST API using WebFlux, Reactor and reactive MongoDB repositories, exercised with WebTestClient and reactive CRUD flows.", page: "projects/spring-webflux-rest.html", link: "https://github.com/kaveenprabodhya/spring-webflux-rest-demo" },
          { icon: "exe", name: "Spring Cloud Currency Microservices", summary: "Multi-service Spring Cloud system with Eureka, API Gateway, Config Server, OpenFeign, Resilience4j, tracing and Docker Compose orchestration.", page: "projects/spring-cloud-currency.html", link: "https://github.com/kaveenprabodhya/currency-conversion-and-exchange-microservice-app" },
          { icon: "exe", name: "Spring JMS Messaging", summary: "JMS messaging demo using Spring JmsTemplate, ActiveMQ Artemis, scheduled producers, listeners, JSON message conversion and request-reply queues.", page: "projects/spring-jms.html", link: "https://github.com/kaveenprabodhya/spring-jms-demo" },
          { icon: "exe", name: "Spring REST Docs", summary: "Test-driven API documentation demo combining MockMvc, Spring REST Docs, Asciidoctor, validation, DTO mapping and generated REST reference material.", page: "projects/spring-rest-docs.html", link: "https://github.com/kaveenprabodhya/spring-rest-docs-demo" },
        ],
      },
      {
        name: "React & Angular Applications",
        items: [
          { icon: "globe", name: "Angular Recipe & Shopping Application", summary: "Angular 17 single-page application with lazy-loaded feature modules, guarded routes, reactive forms, RxJS state, HTTP persistence and authentication-aware request handling.", page: "projects/angular-recipe.html", link: "https://github.com/kaveenprabodhya/angular-recipe-project" },
          { icon: "globe", name: "Angular Movie Rental Application", summary: "Angular application with routed movie, customer, rental and administration flows, token-aware HTTP interceptors, route guards, reusable services and unit-test coverage across components and services.", page: "projects/angular-movie-rental.html", link: "https://github.com/kaveenprabodhya/angular-movie-rental-project" },
          { icon: "globe", name: "React Movie Rental Application", summary: "Focused React application demonstrating routed movie browsing, search, authentication flows, API communication, Redux-style state management and reusable UI composition.", page: "projects/react-movie-rental.html", link: "https://github.com/kaveenprabodhya/react-movie-rental-project" },
        ],
      },
      {
        name: "Mobile Product Engineering",
        items: [
          { icon: "globe", name: "SpendWise for iOS", summary: "SwiftUI personal-finance application using feature-level MVVM, domain API services, reusable charts and a companion REST backend.", page: "projects/spendwise-ios.html", link: "https://github.com/kaveenprabodhya/spendwise-ios-project" },
        ],
      }
    ],
  },

  blog: {
    url: "blog/index.html",
    posts: [],
  },

  contact: {
    email: "kaveen.prabodhya@outlook.com",
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/kaveen-prabodhya/" },
      { label: "GitHub", url: "https://github.com/kaveenprabodhya" },
      { label: "ResearchGate", url: "https://www.researchgate.net/profile/Kaveen-Prabodhya" },
      { label: "ORCID", url: "https://orcid.org/0009-0003-6975-5110" },
    ],
  },
};
