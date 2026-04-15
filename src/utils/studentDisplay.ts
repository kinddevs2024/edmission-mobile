type StudentLike =
  | { firstName?: string; lastName?: string; userEmail?: string }
  | null
  | undefined

export function getStudentDisplayName(student: StudentLike, fallback = 'Student'): string {
  if (!student) return fallback
  const name = [student.firstName, student.lastName].filter(Boolean).join(' ').trim()
  return name || student.userEmail || fallback
}

export function getStudentContactEmail(student: StudentLike): string | undefined {
  return student?.userEmail
}
