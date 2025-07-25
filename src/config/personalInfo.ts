export const personalInfo = {
  name: "Jordan Leahy",
  website: "jordanwilliamleahy.com",
  email: "jordan@jordanwilliamleahy.com",
  phone: "+1 (555) 123-4567",
  linkedIn: "linkedin.com/in/jordanleahy",
  github: "github.com/jordanleahy"
} as const;

export const defaultCalendarUrl = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0HtVBzITEmJVDw6wxuGBdLLnH99oOFJpzPZysiE0Tr70J6k5kzzrqp6WLR8SVCmH72f8EyuUBE?gv=true";

export const defaultRecipients = {
  ascertain: "Dear Hoshi & Eli,",
  simplepractice: "Dear SimplePractice Team,",
  getDefault: (companyName: string) => `Dear ${companyName} Team,`
} as const;