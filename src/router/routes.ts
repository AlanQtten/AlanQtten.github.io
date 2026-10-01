import { rustRoutes } from "./rust-routes";
import type { Route } from "./types";

const blogList: Route[] = [
  { text: "关于x-mixed-replace", link: "x-mixed-replace" },
  { text: "--ff和--no-ff", link: "ff-and-no-ff" },
  { text: "一个计算器", link: "a-calculator" },
  { text: "import和require", link: "import-and-require" },
  { text: "岛", link: "island" },
  { text: "一个有趣的选择列", link: "fun-select-col" },
  { text: "一些配色", link: "some-color" },
];

const projects: Route[] = [{ text: "list", link: "list" }];

const ruleList = rustRoutes;
