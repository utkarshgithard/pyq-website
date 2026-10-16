// ─── All exact branch strings stored in the database ────────────────────────

/** All CSE specialisation branches (used in admin upload form) */
export const CSE_SPECIALIZATIONS = [
  "Computer Science & Engineering",
  "Computer Science & Engineering (AI)",
  "Computer Science & Engineering (Cyber Security)",
  "Computer Science & Engineering (Data Science)",
  "Computer Science & Engineering (AI & ML)",
  "Computer Science & Engineering (Internet of Things)",
  "Computer Science & Engg (IoT & Cyber Security including Block Chain Technology)",
  "Computer Science & Engineering (Networks)",
  "Information Technology",
] as const;

/** Other engineering branches (used in admin upload form) */
export const OTHER_BRANCHES = [
  "Civil Engineering",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
] as const;

/** Full list of all exact branch names (used in admin upload form) */
export const ALL_BRANCHES = [
  ...CSE_SPECIALIZATIONS,
  ...OTHER_BRANCHES,
] as const;

export type ExactBranch = (typeof ALL_BRANCHES)[number];

// ─── Student-facing view ─────────────────────────────────────────────────────

/**
 * Student-facing branch groups shown on the home page.
 * Students browse by these broad groups; internally all sub-branches
 * are fetched when the student picks a group.
 */
export const STUDENT_BRANCH_GROUPS = [
  {
    label: "Computer Science & Engineering",
    /** All exact DB branches that belong to this student group */
    matches: CSE_SPECIALIZATIONS as unknown as string[],
  },
  { label: "Civil Engineering", matches: ["Civil Engineering"] },
  {
    label: "Electrical & Electronics Engineering",
    matches: [
      "Electrical & Electronics Engineering",
      "Electrical Engineering",
      "Electronics & Communication",
    ],
  },
  { label: "Mechanical Engineering", matches: ["Mechanical Engineering"] },
] as const;

export type StudentBranchGroup = (typeof STUDENT_BRANCH_GROUPS)[number];

/**
 * Returns the STUDENT_BRANCH_GROUPS entry for a given student-facing label.
 */
export function getStudentGroup(label: string): StudentBranchGroup | undefined {
  return STUDENT_BRANCH_GROUPS.find((g) => g.label === label);
}

// ─── Keep BRANCH_OPTIONS pointing to student-facing labels (used in home-page) ─
export const BRANCH_OPTIONS = STUDENT_BRANCH_GROUPS.map((g) => g.label) as string[];
