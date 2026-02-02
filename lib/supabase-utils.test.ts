import { describe, it, expect } from "vitest"
import { toSnakeCase, toCamelCase, toCamelCaseArray } from "./supabase-utils"

describe("toSnakeCase", () => {
  it("converts simple camelCase keys to snake_case", () => {
    expect(toSnakeCase({ firstName: "John", lastName: "Doe" })).toEqual({
      first_name: "John",
      last_name: "Doe",
    })
  })

  it("converts multi-word camelCase keys", () => {
    expect(
      toSnakeCase({
        resendFromName: "Test",
        resendFromEmail: "test@example.com",
        geminiModel: "gemini-2.0-flash",
      })
    ).toEqual({
      resend_from_name: "Test",
      resend_from_email: "test@example.com",
      gemini_model: "gemini-2.0-flash",
    })
  })

  it("leaves already-snake_case keys unchanged", () => {
    expect(toSnakeCase({ status: "connected", key: "abc123" })).toEqual({
      status: "connected",
      key: "abc123",
    })
  })

  it("handles isDefault, isRecent, createdAt patterns", () => {
    expect(
      toSnakeCase({ isDefault: true, isRecent: false, createdAt: "2024-01-01" })
    ).toEqual({
      is_default: true,
      is_recent: false,
      created_at: "2024-01-01",
    })
  })
})

describe("toCamelCase", () => {
  it("converts snake_case keys to camelCase", () => {
    expect(toCamelCase({ first_name: "John", last_name: "Doe" })).toEqual({
      firstName: "John",
      lastName: "Doe",
    })
  })

  it("converts multi-word snake_case keys", () => {
    expect(
      toCamelCase({
        resend_from_name: "Test",
        resend_from_email: "test@example.com",
        gemini_model: "gemini-2.0-flash",
      })
    ).toEqual({
      resendFromName: "Test",
      resendFromEmail: "test@example.com",
      geminiModel: "gemini-2.0-flash",
    })
  })

  it("leaves already-camelCase keys unchanged", () => {
    expect(toCamelCase({ status: "connected", key: "abc123" })).toEqual({
      status: "connected",
      key: "abc123",
    })
  })

  it("handles is_default, is_recent, created_at patterns", () => {
    expect(
      toCamelCase({
        is_default: true,
        is_recent: false,
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      })
    ).toEqual({
      isDefault: true,
      isRecent: false,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-02",
    })
  })
})

describe("toCamelCaseArray", () => {
  it("converts an array of snake_case objects", () => {
    const input = [
      { id: "1", service: "gemini", gemini_model: "flash", created_at: "2024-01-01" },
      { id: "2", service: "resend", resend_from_name: "Test", created_at: "2024-01-02" },
    ]
    const expected = [
      { id: "1", service: "gemini", geminiModel: "flash", createdAt: "2024-01-01" },
      { id: "2", service: "resend", resendFromName: "Test", createdAt: "2024-01-02" },
    ]
    expect(toCamelCaseArray(input)).toEqual(expected)
  })
})
