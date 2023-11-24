import { Action, ActionResult } from "./types";
import { UndoIcon, RedoIcon } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { t } from "../i18n";
import History, { HistoryEntry } from "../history";
import { ExcalidrawElement } from "../element/types";
import { AppState } from "../types";
import { KEYS } from "../keys";
import { arrayToMap } from "../utils";
import { isWindows } from "../constants";

const writeData = (
  prevElements: readonly ExcalidrawElement[],
  appState: AppState,
  updater: () => HistoryEntry | null,
): ActionResult => {
  const commitToHistory = false;
  if (
    !appState.multiElement &&
    !appState.resizingElement &&
    !appState.editingElement &&
    !appState.draggingElement
  ) {
    const data = updater();
    if (data === null) {
      return { commitToHistory };
    }

    const nextAppState = data.appStateChange.apply(appState);
    // TODO: just keep the map once we have fractional indices
    const nextElements = Array.from(
      data.elementsChange.apply(arrayToMap(prevElements)).values(),
    );

    // TODO: valid? probably yes
    // fixBindingsAfterDeletion(elements, deletedElements);

    return {
      appState: nextAppState,
      elements: nextElements,
      commitToHistory,
      syncHistory: true,
    };
  }
  return { commitToHistory };
};

type ActionCreator = (history: History) => Action;

export const createUndoAction: ActionCreator = (history) => ({
  name: "undo",
  trackEvent: { category: "history" },
  perform: (elements, appState) =>
    writeData(elements, appState, () => history.undoOnce()),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] &&
    event.key.toLowerCase() === KEYS.Z &&
    !event.shiftKey,
  PanelComponent: ({ updateData, data }) => (
    <ToolButton
      type="button"
      icon={UndoIcon}
      aria-label={t("buttons.undo")}
      onClick={updateData}
      size={data?.size || "medium"}
    />
  ),
  commitToHistory: () => false,
});

export const createRedoAction: ActionCreator = (history) => ({
  name: "redo",
  trackEvent: { category: "history" },
  perform: (elements, appState) =>
    writeData(elements, appState, () => history.redoOnce()),
  keyTest: (event) =>
    (event[KEYS.CTRL_OR_CMD] &&
      event.shiftKey &&
      event.key.toLowerCase() === KEYS.Z) ||
    (isWindows && event.ctrlKey && !event.shiftKey && event.key === KEYS.Y),
  PanelComponent: ({ updateData, data }) => (
    <ToolButton
      type="button"
      icon={RedoIcon}
      aria-label={t("buttons.redo")}
      onClick={updateData}
      size={data?.size || "medium"}
    />
  ),
  commitToHistory: () => false,
});
