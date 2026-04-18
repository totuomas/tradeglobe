import { themes } from "./theme.js";

export const state = {
  selectedISO: null,
  partners: new Map(),
  mode: "export",
  theme: themes.dark
};