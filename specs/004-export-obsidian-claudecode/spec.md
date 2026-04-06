# Feature Specification: Export, Obsidian Integration & Claude Code Connection

**Feature Branch**: `004-export-obsidian-claudecode`
**Created**: 2026-04-07
**Status**: Draft
**Input**: User description: "下一版本功能：1.支持配图截取，可以将页面上的html一键导出为图片 2.连接obsidian cli，使用obsidian cli来管理笔记与文档 3.尝试直接接入claude code，从我们和模型直接对话，到与claude code对话，然后渲染"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One-Click Visual Export (Priority: P1)

As a knowledge worker, I want to capture any visual element on the page as an image with a single click, so that I can easily share, embed, or archive visual knowledge content without needing external screenshot tools.

**Why this priority**: This is the most universally useful capability — every user needs to export visuals. It delivers immediate standalone value and is independent of the other features.

**Independent Test**: Can be fully tested by rendering any visual content, clicking export, and verifying the output image matches the on-screen content.

**Acceptance Scenarios**:

1. **Given** a visualization is displayed on the page, **When** the user clicks the export button, **Then** an image file is generated that faithfully reproduces the visible content and is downloaded to the user's device.
2. **Given** a visualization is displayed, **When** the user selects a specific region to export, **Then** only the selected region is captured as an image.
3. **Given** an export is in progress, **When** the content is large or complex, **Then** the user sees a progress indicator and the export completes without quality loss.

---

### User Story 2 - Obsidian Note Management (Priority: P2)

As a knowledge worker who uses Obsidian for personal knowledge management, I want to send visual knowledge content directly to my Obsidian vault, so that my visual insights are integrated with my existing notes and documentation workflow.

**Why this priority**: Enables a powerful knowledge management workflow by bridging the visual tool with a popular note-taking system. Builds on export capability (P1) but delivers significant standalone workflow value.

**Independent Test**: Can be tested by connecting to an Obsidian vault, creating/updating notes with visual content, and verifying the notes appear correctly in Obsidian.

**Acceptance Scenarios**:

1. **Given** the user has configured their Obsidian vault connection, **When** the user sends content to Obsidian, **Then** a new note is created in the vault containing the visual content and any associated text.
2. **Given** an existing note in the Obsidian vault, **When** the user updates and re-sends content to the same note, **Then** the existing note is updated without data loss.
3. **Given** the Obsidian connection is not available, **When** the user attempts to send content, **Then** a clear error message is shown explaining the connection issue.

---

### User Story 3 - Claude Code Conversation & Rendering (Priority: P3)

As a user, I want to interact directly with Claude Code (instead of only the raw model API), so that I can leverage Claude Code's full capabilities including tool use, file operations, and multi-step reasoning, with the results rendered as visual knowledge.

**Why this priority**: This is an exploratory integration that shifts the interaction model. It builds on P1 and P2 but opens a fundamentally new way to use the system — from "chat with a model" to "collaborate with an AI coding agent."

**Independent Test**: Can be tested by initiating a conversation through Claude Code, receiving a multi-step response, and verifying the rendered output reflects the full conversation including any tool results.

**Acceptance Scenarios**:

1. **Given** the Claude Code connection is configured, **When** the user sends a prompt, **Then** the response is rendered as visual knowledge content, including any intermediate steps or tool outputs.
2. **Given** an ongoing conversation, **When** Claude Code produces multi-step results (e.g., code generation, file edits, analysis), **Then** each step is rendered progressively so the user can follow the reasoning.
3. **Given** Claude Code encounters an error, **When** an error response is received, **Then** the error is displayed in a user-friendly format within the visual interface.

---

### Edge Cases

- What happens when the exported image would be extremely large (e.g., a full-page visualization with thousands of elements)?
- How does the system handle Obsidian vault connection failures or permission issues?
- What happens when Claude Code produces output that is too large or complex to render in a single view?
- How does the system handle concurrent operations (e.g., exporting while Claude Code is streaming a response)?
- What happens when the user's device has limited storage for exported images?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a one-click button to export any rendered HTML content on the page as an image file.
- **FR-002**: The system MUST support exporting the full visualization or a user-selected region.
- **FR-003**: The exported image MUST faithfully reproduce the visual appearance of the on-screen content, including colors, fonts, and layout.
- **FR-004**: The system MUST save exported images in PNG format with appropriate quality settings.
- **FR-005**: The system MUST allow users to configure a connection to an Obsidian vault via the Obsidian CLI.
- **FR-006**: The system MUST enable users to create new notes in the connected Obsidian vault containing visual content and text.
- **FR-007**: The system MUST enable users to update existing notes in the Obsidian vault without overwriting unrelated content.
- **FR-008**: The system MUST support organizing notes into folders or tags within the Obsidian vault.
- **FR-009**: The system MUST provide an interface to converse with Claude Code and receive responses.
- **FR-010**: The system MUST render Claude Code's responses as visual knowledge content within the existing visualization framework.
- **FR-011**: The system MUST progressively render multi-step Claude Code outputs, showing intermediate results as they become available.
- **FR-012**: The system MUST display meaningful error messages when any integration (export, Obsidian, Claude Code) encounters issues.
- **FR-013**: The system MUST preserve the user's connection settings (Obsidian vault path, Claude Code configuration) between sessions.

### Key Entities

- **Exported Image**: A captured snapshot of visual content; attributes include source content reference, export region, image format, and timestamp.
- **Obsidian Connection**: A configured link to an Obsidian vault; attributes include vault path, connection status, and last sync time.
- **Obsidian Note**: A note within the connected vault; attributes include title, content (text + embedded visuals), folder path, and tags.
- **Claude Code Session**: An active conversation with Claude Code; attributes include session identifier, conversation history, and current status.
- **Rendered Output**: The visual representation of Claude Code's response; attributes include source session, rendering format, and intermediate steps.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can export any on-screen visual content as an image in under 5 seconds with one click.
- **SC-002**: Exported images reproduce the on-screen content with full visual fidelity (pixel-perfect match for static content).
- **SC-003**: Users can create or update an Obsidian note with visual content in under 10 seconds from clicking "Send to Obsidian."
- **SC-004**: Claude Code responses begin rendering within 3 seconds of receiving the first response chunk.
- **SC-005**: All three integrations (export, Obsidian, Claude Code) work correctly on the first attempt for 90% of users without consulting documentation.
- **SC-006**: Connection settings persist across sessions so users do not need to reconfigure on restart.

## Assumptions

- Users have Obsidian installed and a vault accessible from the local filesystem if they wish to use Obsidian integration.
- Users have Claude Code installed and configured if they wish to use the Claude Code integration.
- The Obsidian CLI provides standard filesystem-level access to vault content (read, write, organize notes as markdown files).
- Exported images are generated locally on the user's device without requiring server-side processing.
- Claude Code is accessible as a local CLI tool on the user's machine.
- PNG is the default export format; additional formats may be considered in future versions.
- Users have a stable local environment sufficient to run all three features simultaneously if desired.
- The existing visualization rendering framework can be extended to display Claude Code conversation outputs.
