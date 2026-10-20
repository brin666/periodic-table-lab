export const feedbackEnglish = {
  conversation: {
    initial: "What happened in this screenshot, or what would you like to improve?",
    initialOnPage: "What happened on this page, or what would you like to improve?",
    intent: {
      text: "Is this mainly an interaction issue, content that needs checking, or a suggestion for improvement?",
      suggestions: [
        "An interaction issue",
        "Content needs checking",
        "A suggestion for improvement",
      ],
    },
    unknown: {
      example:
        "Could you share one specific example, such as a line of text, an action, or a feature you would like?",
      action:
        "What should we do first: fix an interaction, verify the content, or add a feature? It is okay if you are not sure yet.",
      impact:
        "How does this affect your learning or use of the page? You can say if you are not sure.",
    },
    minimum: {
      supplement:
        "Is there one more detail that would help us understand? You can answer “No further details.”",
      focus:
        "Is there anything else you especially want us to check? If you have covered it all, answer “Already covered.”",
    },
    bug: {
      steps: {
        action:
          "Which item did you click or select? What happened before and after?",
        target:
          "How did you get here? Please list the steps that triggered the issue.",
        general:
          "What steps triggered this issue, and where on the page did it happen?",
      },
      expectedContext: {
        context:
          "Does this happen every time or only sometimes? Which device and browser are you using?",
        expected: "What did you expect to happen instead?",
        both:
          "What did you expect to happen? Does this happen every time or only sometimes?",
      },
      impact: "What were you trying to do, and which step did this issue block?",
    },
    content: {
      location:
        "Where exactly is this content? If you can, quote it or describe its location.",
      correctionReference: {
        correction:
          "Which textbook, page, or reliable source supports the correction? It is okay if you are not sure.",
        reference:
          "What should the content say instead? Please include the correction or value.",
        both:
          "What should this say instead? If you know the source, include its title, page, or a link.",
      },
      impact: "How does this content affect your understanding or use of the page?",
    },
    suggestion: {
      desiredChange:
        "What would you like the page to add or change? What result would you expect?",
      useCase: "In what learning or usage situation would this be useful?",
      priority: "What inconvenience would this improvement solve?",
    },
    description: {
      heading: "Feedback record",
      answerLabel: "Your answer:",
    },
    uncertainAnswers: [
      "Not sure",
      "I don't know",
      "No idea",
      "I can't remember",
      "I'd rather not say",
      "Skip",
      "None",
      "Nothing",
      "No further details",
      "No other details",
      "Already covered",
    ],
  },
  ui: {
    launcher: "Feedback",
    captureTitle: "Select an area of this page",
    captureImageAlt: "Current page screenshot; drag to select the area to report",
    capturePreparing: "Preparing screenshot selection…",
    captureReady: "When the area is selected, choose Finish screenshot",
    captureDragHint: "Drag over the problem area · Esc to cancel",
    captureToolbar: "Screenshot controls",
    captureSelector: "Screenshot region selector",
    cancelSelection: "Cancel selection",
    cancel: "Cancel",
    reselect: "Select again",
    textOnly: "Continue without a screenshot",
    countdownAria: "Retake after a three-second delay",
    countdownTitle: "Retake in three seconds to capture a hover state",
    finishScreenshot: "Finish screenshot",
    fullScreenshot: "Use the full screenshot",
    chatTitle: "Tell us about it",
    recapture: "Select screenshot area again",
    close: "Close feedback",
    conversation: "Feedback conversation",
    screenshotAlt: "Feedback screenshot",
    selectedRegion: "Selected area",
    assistant: "Feedback assistant",
    user: "You",
    summaryReady: "Your feedback is ready. Review the details below before submitting.",
    summaryRecord: "Feedback record",
    answerCount: (count: number) => `${count} ${count === 1 ? "answer" : "answers"}`,
    publicDisclosure:
      "The screenshot, conversation, and page details will be public in GitHub Issues. Please do not include personal information.",
    requestNote:
      "Please keep feedback relevant to this site and avoid duplicates or unrelated content. We will review it and reply within one week. Confirmed issues will be scheduled for fixes; suggestions will be evaluated for future updates.",
    pageDetails: "Review the page details to be submitted",
    pageUrl: "Page URL",
    learningMode: "Learning mode",
    juniorVersion: "Junior version",
    seniorVersion: "Senior version",
    viewport: "Viewport",
    consent:
      "I understand that the screenshot, conversation, and page details will be public in GitHub Issues.",
    creatingFeedback: "Creating feedback",
    uploadingFeedback: "Uploading feedback",
    uploadWaiting:
      "Upload complete. Waiting for the server to create the public issue.",
    uploadProgressOnly: "Only actual upload progress is shown.",
    uploadKeepsRunning:
      "Processing continues if you close this window. Reopen it to check the result.",
    uploadProgress: "Feedback upload progress",
    uploading: "Uploading",
    errorUnconfigured: "Feedback service is not configured",
    errorOutcomeUnknown: "Submission status needs confirmation",
    errorNotSubmitted: "Feedback was not submitted",
    retryAfter: (time: string) => `Please wait ${time} before trying again.`,
    draftKept: "Your description and screenshot are still saved in this draft.",
    successTitle: "Feedback created",
    successWithNumber: (number: string) => `Public feedback #${number} was created.`,
    successWithoutNumber: "Public feedback was created.",
    successFollowUp: "You can follow its progress on GitHub.",
    viewOnGitHub: "View feedback on GitHub",
    feedbackId: "Feedback ID:",
    replyLabel: "Reply to the feedback assistant",
    replyPlaceholder: "Describe what happened…",
    sendReply: "Send reply",
    editLastAnswer: "Edit your last answer",
    draftOnly: "Before you confirm, the screenshot and conversation stay in this draft.",
    confirmUpload: "Confirm and submit",
    closeProgress: "Close progress window",
    retrySameId: "Retry with the same ID",
    retry: "Try again",
    newFeedback: "New feedback",
    done: "Done",
    countdown: (count: number) => `Taking another screenshot in ${count} seconds`,
    countdownOne: "Taking another screenshot in 1 second",
    websiteField: "Website",
    errors: {
      generic: "Submission failed. Your draft is saved; check your connection and try again.",
      feedbackUnavailable: "Feedback could not be submitted. Please try again later.",
      storageUnavailable: "Feedback storage is temporarily unavailable. Please try again later.",
      githubUnavailable: "GitHub is temporarily unavailable. Please try again later.",
      unconfigured:
        "Anonymous feedback is not configured, so nothing was submitted. Keep your draft and try again later.",
      processing:
        "The server is still checking whether this feedback was created. Try again later with the same draft to avoid duplicates.",
      rateLimited: "Too many submissions were made in a short time. Please try again later.",
      connectionUnknown:
        "The connection was interrupted, so the submission status is unknown. Try again later with the same draft to avoid duplicates.",
      statusUnknown:
        "The server could not confirm the result. Try again later with the same draft to avoid duplicates.",
      timeout:
        "The server did not respond in time, so the submission status is unknown. Try again later with the same draft to avoid duplicates.",
      http: (status: number) => `The feedback service could not process this submission (HTTP ${status}). Your draft has been kept.`,
      insecureEndpoint: "The feedback endpoint must use HTTPS. Nothing was submitted.",
      invalidEndpoint: "The feedback endpoint URL is invalid. Nothing was submitted.",
      captureUnavailable: "Screenshot capture failed.",
      captureTextAvailable: "You can still continue with a text description.",
      captureKeptScreenshot:
        "The previous screenshot is still available. Review or reselect it, then confirm before submitting publicly.",
      screenshotTooLarge: "The screenshot is too large. Select a smaller area and try again.",
      imageReadFailed: "Some images on the page could not be read.",
      screenshotUnreadable: "The page screenshot could not be read.",
      screenshotCanvasFailed: "A screenshot could not be created.",
      screenshotUseFailed: "This screenshot could not be used. You can continue with a text description.",
      cropFailed: "The screenshot could not be cropped. You can continue with a text description.",
      imageProcessingFailed: "The screenshot could not be processed. You can continue with a text description.",
    },
  },
} as const;
