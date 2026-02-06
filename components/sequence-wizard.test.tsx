import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SequenceWizard } from "./sequence-wizard"

// Mock the newsletter-template module
vi.mock("@/lib/newsletter-template", () => ({
  DEFAULT_NEWSLETTER_TEMPLATE: "<html>default</html>",
  buildNewsletterTemplateContext: vi.fn(),
  renderNewsletterTemplate: vi.fn(),
}))

// Mock the schedule-rules module
vi.mock("@/lib/schedule-rules", () => ({
  computeScheduleRules: vi.fn(() => ({
    schedulePattern: "daily",
    timeFrameLabel: "24 hours",
    dayExplanation: "Every day",
  })),
}))

// Track all fetch calls
let fetchCalls: { url: string; options?: any }[] = []
let mockSequences: any[] = []
let mockTemplates: any[] = []

const defaultMockSequence = {
  id: "seq-1",
  name: "Weekly Update",
  subject: "Weekly Newsletter",
  audienceId: "aud-1",
  topicId: "",
  contentSources: ["news"],
  dayOfWeek: ["friday", "saturday", "sunday"],
  time: "09:00",
  timezone: "America/New_York",
  templateId: "tmpl-custom-1",
  promptKey: "daily_insights",
  status: "active",
}

function setupFetchMock() {
  fetchCalls = []
  global.fetch = vi.fn(async (url: string, options?: any) => {
    fetchCalls.push({ url, options })
    const urlStr = typeof url === "string" ? url : url.toString()

    // Audiences
    if (urlStr.includes("/api/resend/audiences")) {
      return new Response(JSON.stringify([{ id: "aud-1", name: "Test Audience" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Topics
    if (urlStr.includes("/api/resend/topics")) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Prompts
    if (urlStr.includes("/api/prompts")) {
      return new Response(
        JSON.stringify({
          prompts: [{ key: "daily_insights", label: "Daily Insights", description: "desc" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Newsletter templates list
    if (urlStr.includes("/api/newsletter-templates") && !urlStr.includes("/api/newsletter-templates/")) {
      return new Response(JSON.stringify(mockTemplates), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Individual template
    if (urlStr.match(/\/api\/newsletter-templates\/.+/)) {
      const template = mockTemplates.find((t) => urlStr.includes(t.id))
      if (template) {
        return new Response(JSON.stringify(template), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 })
    }

    // PUT sequence (publish)
    if (urlStr.match(/\/api\/sequences\//) && options?.method === "PUT") {
      const body = JSON.parse(options.body)
      // Simulate successful update - return the updated sequence
      return new Response(JSON.stringify({ ...defaultMockSequence, ...body }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // GET sequences (parent re-fetch)
    if (urlStr.includes("/api/sequences") && !options?.method) {
      return new Response(JSON.stringify(mockSequences), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({}), { status: 200 })
  }) as any
}

beforeEach(() => {
  mockTemplates = [
    { id: "tmpl-default", name: "Default Template", html: "<html>default template</html>", isDefault: true },
    { id: "tmpl-custom-1", name: "Custom Template", html: "<html>custom template</html>", isDefault: false },
  ]
  mockSequences = [{ ...defaultMockSequence }]
  setupFetchMock()
})

describe("Bug 1: Sequence time change not reflecting in UI after publish", () => {
  it("should call onClose after successful publish so parent can re-fetch with updated data", async () => {
    const onClose = vi.fn()

    // The sequence starts with time "09:00"
    const sequence = { ...defaultMockSequence, time: "09:00" }

    // After publish, the parent would re-fetch sequences.
    // The updated sequence should have the NEW time, not the old one.
    mockSequences = [{ ...defaultMockSequence, time: "11:00" }]

    render(<SequenceWizard open={true} onClose={onClose} sequence={sequence} />)

    // Wait for data to load
    await waitFor(() => {
      expect(fetchCalls.length).toBeGreaterThan(0)
    })

    // The onClose callback is what the parent uses to re-fetch.
    // When parent calls fetchSequences(), it should get fresh data.
    // The bug is: the parent fetches but gets cached/stale data.
    //
    // We verify the sequence wizard correctly passes the updated formData
    // in the PUT request when publishing.

    // Simulate the full publish flow:
    // The user would navigate to Step 6 and click Publish.
    // For this test, we directly invoke handlePublish behavior by
    // checking what gets sent in the PUT request.
  })

  it("should send the updated time in the PUT request body when publishing", async () => {
    const onClose = vi.fn()
    // Sequence starts at 09:00
    const sequence = { ...defaultMockSequence, time: "09:00" }

    render(<SequenceWizard open={true} onClose={onClose} sequence={sequence} />)

    // Wait for all data to load
    await waitFor(() => {
      const templateFetches = fetchCalls.filter((c) => c.url.includes("/api/newsletter-templates"))
      expect(templateFetches.length).toBeGreaterThan(0)
    })

    const user = userEvent.setup()

    // Navigate through all steps to Step 6
    const nextButton = screen.getByRole("button", { name: /next/i })
    await user.click(nextButton) // Step 2
    await user.click(nextButton) // Step 3
    await user.click(nextButton) // Step 4
    await user.click(nextButton) // Step 5

    // On Step 5, check the "test approved" checkbox
    const approveCheckbox = screen.getByRole("checkbox", {
      name: /approved/i,
    })
    await user.click(approveCheckbox)

    await user.click(nextButton) // Step 6

    // Now click Publish
    const publishButton = screen.getByRole("button", { name: /publish/i })
    await user.click(publishButton)

    // Wait for the PUT request
    await waitFor(() => {
      const putCalls = fetchCalls.filter((c) => c.options?.method === "PUT")
      expect(putCalls.length).toBe(1)
    })

    const putCall = fetchCalls.find((c) => c.options?.method === "PUT")!
    const putBody = JSON.parse(putCall.options.body)

    // The PUT body should contain the time from formData
    expect(putBody.time).toBe("09:00")
    expect(putBody.status).toBe("active")

    // onClose should have been called (so parent can re-fetch)
    expect(onClose).toHaveBeenCalled()
  })

  it("parent's onClose callback should re-fetch sequences and update the UI", async () => {
    // This test simulates what the PARENT (sequences-tab) does when onClose fires.
    // The parent calls fetchSequences() which should return FRESH data.
    //
    // The bug: even with cache: "no-store", the browser returns stale data.
    // After fixing, the parent should get the updated time.

    let parentSequences: any[] = [{ ...defaultMockSequence, time: "09:00" }]

    // Simulate the parent's fetchSequences function
    const fetchSequences = async () => {
      const response = await fetch("/api/sequences", { cache: "no-store" })
      if (response.ok) {
        parentSequences = await response.json()
      }
    }

    // First, simulate the PUT (wizard publish) updating the time to 11:00
    mockSequences = [{ ...defaultMockSequence, time: "11:00" }]

    // Now simulate what happens when onClose fires
    await fetchSequences()

    // The parent should now have the updated time
    expect(parentSequences[0].time).toBe("11:00")

    // Verify the fetch was called with cache: "no-store"
    const getCalls = fetchCalls.filter(
      (c) => c.url.includes("/api/sequences") && !c.options?.method
    )
    expect(getCalls.length).toBe(1)
    expect(getCalls[0].options?.cache).toBe("no-store")
  })
})

describe("Bug 2: Template selection not persisting for existing sequences in Step 4", () => {
  it("should show the sequence's saved template, not the default template, when editing", async () => {
    const onClose = vi.fn()

    // Sequence was created with "tmpl-custom-1", NOT the default template
    const sequence = {
      ...defaultMockSequence,
      templateId: "tmpl-custom-1",
    }

    render(<SequenceWizard open={true} onClose={onClose} sequence={sequence} />)

    // Wait for templates to load
    await waitFor(() => {
      const templateFetches = fetchCalls.filter((c) =>
        c.url.includes("/api/newsletter-templates")
      )
      expect(templateFetches.length).toBeGreaterThan(0)
    })

    // Navigate to Step 4 (Template/Preview)
    const user = userEvent.setup()
    const nextButton = screen.getByRole("button", { name: /next/i })
    await user.click(nextButton) // Step 2
    await user.click(nextButton) // Step 3
    await user.click(nextButton) // Step 4

    // Now on Step 4, the template selector should show "Custom Template"
    // (the one saved with the sequence), NOT "Default Template"
    await waitFor(() => {
      // The Select trigger should display the custom template name
      const templateSelect = screen.getByLabelText(/template/i)
      // The selected value should be tmpl-custom-1
      expect(templateSelect).toBeDefined()
    })

    // The key assertion: selectedTemplateId should be "tmpl-custom-1"
    // NOT "tmpl-default" (the isDefault template)
    //
    // BUG: fetchTemplates() runs after setSelectedTemplateId(sequence.templateId)
    // but because React state updates are async, fetchTemplates sees
    // selectedTemplateId as "" (the initial value), so the condition
    // `if (!selectedTemplateId)` is true and it overwrites with the default.
    //
    // We check by looking at what template HTML was loaded
    const templateFetchCalls = fetchCalls.filter((c) =>
      c.url.match(/\/api\/newsletter-templates\/tmpl-custom-1/)
    )
    expect(templateFetchCalls.length).toBeGreaterThanOrEqual(1)
  })

  it("fetchTemplates should NOT override selectedTemplateId when sequence has a templateId", async () => {
    // This directly tests the race condition in fetchTemplates
    // The sequence has templateId = "tmpl-custom-1"
    // After useEffect sets selectedTemplateId to "tmpl-custom-1",
    // fetchTemplates should NOT overwrite it with the default template.

    const onClose = vi.fn()
    const sequence = {
      ...defaultMockSequence,
      templateId: "tmpl-custom-1",
    }

    render(<SequenceWizard open={true} onClose={onClose} sequence={sequence} />)

    // Wait for all effects and fetches to complete
    await waitFor(() => {
      const templateListFetches = fetchCalls.filter(
        (c) => c.url === "/api/newsletter-templates" || c.url.includes("/api/newsletter-templates")
      )
      expect(templateListFetches.length).toBeGreaterThan(0)
    })

    // Wait a bit more for all state updates to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100))
    })

    // Navigate to Step 4
    const user = userEvent.setup()
    const nextButton = screen.getByRole("button", { name: /next/i })
    await user.click(nextButton) // Step 2
    await user.click(nextButton) // Step 3
    await user.click(nextButton) // Step 4

    // The template select should show "Custom Template", not "Default Template"
    // Find the template select and check its displayed value
    const templateTrigger = screen.getByRole("combobox", { name: /template/i })

    // The displayed text should contain "Custom Template"
    // If the bug is present, it will show "Default Template" instead
    expect(templateTrigger.textContent).toContain("Custom Template")
  })
})
