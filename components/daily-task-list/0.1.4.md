# Daily Task List

Add, rename, reorder, complete and reopen tasks, and undo a delete. Built from Inline Edit, Context Menu and Sortable List; your app owns the tasks and every save.

## Release

Version: 0.1.4. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/daily-task-list/0.1.4.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/daily-task-list-actions.tsx

- @ui/daily-task-list-capture.tsx

- @ui/daily-task-list-feedback.tsx

- @ui/daily-task-list-root.tsx

- @ui/daily-task-list-sections.tsx

- @ui/daily-task-list-state.tsx

- @ui/daily-task-list-title.tsx

- @ui/daily-task-list.tsx

- @ui/daily-task-list.md

Npm dependencies: @base-ui/react@1.9.0, motion@14.6.0.

Pinned registry dependencies: inline-edit@0.1.3, context-menu@0.1.2, sortable-list@0.1.3.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as daily-task-list.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { DailyTaskList, DailyTaskListHeader, DailyTaskListCapture, DailyTaskListActive, DailyTaskListCompleted, DailyTaskListEmpty, DailyTaskListFeedback, type DailyTask } from "@/components/ui/daily-task-list";

export default function DailyTaskListExample() {
  const [tasks, setTasks] = useState<DailyTask[]>([
    { id: "a", title: "Sketch the inspector", done: false },
    { id: "b", title: "Review interactions", done: true },
  ]);
  return (
    <DailyTaskList tasks={tasks}
      onCreate={async title => { setTasks(current => [{ id: crypto.randomUUID(), title, done: false }, ...current]); }}
      onRename={async (task, title) => { setTasks(current => current.map(item => item.id === task.id ? { ...item, title } : item)); }}
      onToggle={async (task, done) => { setTasks(current => [...current.filter(item => item.id !== task.id), { ...task, done }]); }}
      onReorder={async (ordered, _move, section) => {
        setTasks(current => section === "active"
          ? [...ordered, ...current.filter(item => item.done)]
          : [...current.filter(item => !item.done), ...ordered]);
      }}
      onDelete={async task => { setTasks(current => current.filter(item => item.id !== task.id)); }}
      onRestore={async task => { setTasks(current => [task, ...current]); }}>
      <DailyTaskListHeader label="Today" />
      <DailyTaskListCapture />
      <DailyTaskListActive />
      <DailyTaskListEmpty />
      <DailyTaskListCompleted />
      <DailyTaskListFeedback />
    </DailyTaskList>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| tasks | T extends { id, title, done }[] |  | All of the day's tasks in your order; put new tasks first to show them at the top. Active and completed tasks show in separate sections. |
| onToggle | (task: T, done: boolean) => void \| Promise<unknown> |  | Completing first strikes the title, then calls this; the task slides into Completed once you update tasks, landing where it sits in your order (move it to the end to show it at the bottom). A rejection retracts the strike. |
| onCreate / onRename | (…) => void \| Promise<unknown> |  | Save a new task or a new title. A returned promise shows saving; rejecting keeps your data and offers Retry. |
| onReorder | (ordered: T[], move, section) => void \| Promise<unknown> |  | Called once per completed move with the new order of that section ("active" or "completed"); each section keeps its own order. |
| onDelete / onRestore | (task: T) => void \| Promise<unknown> |  | Delete a task, then restore it when the person presses Undo. |
| validateTitle | (title: string) => string \| null |  | Return a message to reject a title. Defaults to requiring a non-empty title. |
| disabled | boolean | false | Shows the day without allowing changes. |
| motion | boolean | true | Animation in every part. Turning it off never removes an action. Reduced motion is always honored. |
| messages | Partial<DailyTaskListMessages> |  | Replace labels and announcements, for example to translate them. |
| portalContainer | HTMLElement \| null |  | Where task menus render. Defaults to document.body. |
| Header, Capture, Active, Completed, Empty, Feedback | parts |  | Compose the ones you need. Header takes the day label; Active and Completed take renderMeta, renderActions and classNames for rows, checkboxes and menus. |
| useDailyTaskList() | hook |  | Active and completed tasks, busy IDs, the latest failure or deletion, and actions, for building your own parts. |

## Supported states

- empty

- all done

- saving

- error

- disabled

## Composition and customization

Install this Block to receive its three pinned UICoolKit Component dependencies automatically. The Block imports them by the same installed shadcn paths used in the consumer app. It adds no required UICoolKit runtime.

Compose Header, Capture, Active, Empty, Completed and Feedback as needed. Active and Completed accept renderMeta, renderActions and part classNames; keep labels and actions accessible when replacing them. Rename uses Inline Edit's Ghost presentation.

~~~tsx
<DailyTaskList tasks={tasks} onCreate={createTask} onRename={renameTask}
  onToggle={toggleTask} onReorder={reorderTasks}
  onDelete={deleteTask} onRestore={restoreTask}
  className="rounded-3xl border p-6" motion={false}>
  <DailyTaskListHeader label="Studio plan" className="font-semibold" />
  <DailyTaskListCapture />
  <DailyTaskListActive renderMeta={task => <span>{task.project}</span>} />
  <DailyTaskListEmpty>Make room for one useful task.</DailyTaskListEmpty>
  <DailyTaskListCompleted />
  <DailyTaskListFeedback />
</DailyTaskList>
~~~

Use the imports from the minimal example. This fragment assumes a task type extending DailyTask with project metadata and real host callbacks.

## Task model and callbacks

The host owns IDs, titles, completion state and order. Use stable IDs. Return promises from create, rename, complete/reopen, reorder, delete and restore callbacks so pending and failures are represented correctly. Commit host state after persistence succeeds; a rejected action keeps the authoritative data and exposes recovery.

Active and completed sections reorder separately. onReorder receives the section name and that section's new order; merge it back with the other section. Put newly created tasks first if desired. Append a newly completed task to the host list if it should appear last in Completed.

Deletion exposes Undo through the host's restore action. Complete/reopen first animates the title, then hands the operation to the host; failed persistence retracts the visual change. There is no fake server success.

Replace messages to translate labels/announcements, validateTitle to validate capture/rename and portalContainer to scope action menus to the host's theme. useDailyTaskList exposes state/actions for custom parts inside the root. disabled prevents edits across the composition.

## Motion and boundaries

Set motion={false} to disable optional effects in the composed pieces; reduced motion is honored. Phone action menus use bottom sheets. Verify persistence rejection, retry, undo and multiple configured instances after connecting the host callbacks.

A single host-labelled day only. Calendar scheduling, recurrence, reminders, accounts, cloud sync, collaboration and subtasks are outside this release. The minimal example is local state for teaching integration, not durable storage.

## Reorder retry safety

Retry uses the section’s current tasks, preserving tasks captured after a failed move and leaving the other section unchanged. Disabled or busy/locked tasks prevent an invalid retry; retry becomes available again when the move is allowed.

## Accessibility and integration checks

- Every action is reachable without a gesture: the ••• button on each task opens rename, move, complete and delete; the drag handle also moves with arrow keys.

- The capture field keeps its text and links its error when a title is invalid or saving fails.

- Checkboxes are named by their task and show saving with aria-busy; a failed save leaves them as they were.

- Undo and Retry appear in a polite live region; the progress bar reports done and total.

- Completed is a disclosure button with aria-expanded.

- Animation is skipped with reduced motion or motion={false}.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/daily-task-list/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
