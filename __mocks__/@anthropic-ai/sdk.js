// Manual mock for @anthropic-ai/sdk
// Required because the package is not yet installed (run `npm install`).
// Jest cannot auto-mock a module that doesn't exist on disk, so this stub
// acts as the resolved module for all test imports.

const mockMessagesCreate = jest.fn().mockResolvedValue({
  content: [{ type: "text", text: "Mocked draft message" }],
});

const MockAnthropic = jest.fn().mockImplementation(() => ({
  messages: { create: mockMessagesCreate },
}));

// Expose the inner mock so tests can reconfigure it
MockAnthropic._mockCreate = mockMessagesCreate;

module.exports = { default: MockAnthropic, __esModule: true };
