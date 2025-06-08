import { TimezoneOption } from "./types"

export const TIMEZONES: TimezoneOption[] = [
  { value: "Pacific/Midway", label: "GMT-11:00 - Midway Island", offset: "GMT-11:00", city: "Midway Island" },
  { value: "Pacific/Honolulu", label: "GMT-10:00 - Hawaii", offset: "GMT-10:00", city: "Hawaii" },
  { value: "America/Anchorage", label: "GMT-09:00 - Alaska", offset: "GMT-09:00", city: "Alaska" },
  { value: "America/Los_Angeles", label: "GMT-08:00 - Pacific Time", offset: "GMT-08:00", city: "Los Angeles" },
  { value: "America/Denver", label: "GMT-07:00 - Mountain Time", offset: "GMT-07:00", city: "Denver" },
  { value: "America/Chicago", label: "GMT-06:00 - Central Time", offset: "GMT-06:00", city: "Chicago" },
  { value: "America/New_York", label: "GMT-05:00 - Eastern Time", offset: "GMT-05:00", city: "New York" },
  { value: "America/Caracas", label: "GMT-04:00 - Venezuela", offset: "GMT-04:00", city: "Caracas" },
  { value: "America/Sao_Paulo", label: "GMT-03:00 - Brazil", offset: "GMT-03:00", city: "São Paulo" },
  { value: "Atlantic/South_Georgia", label: "GMT-02:00 - South Georgia", offset: "GMT-02:00", city: "South Georgia" },
  { value: "Atlantic/Azores", label: "GMT-01:00 - Azores", offset: "GMT-01:00", city: "Azores" },
  { value: "UTC", label: "GMT+00:00 - UTC", offset: "GMT+00:00", city: "UTC" },
  { value: "Europe/London", label: "GMT+00:00 - London", offset: "GMT+00:00", city: "London" },
  { value: "Europe/Paris", label: "GMT+01:00 - Paris", offset: "GMT+01:00", city: "Paris" },
  { value: "Europe/Berlin", label: "GMT+01:00 - Berlin", offset: "GMT+01:00", city: "Berlin" },
  { value: "Europe/Rome", label: "GMT+01:00 - Rome", offset: "GMT+01:00", city: "Rome" },
  { value: "Europe/Athens", label: "GMT+02:00 - Athens", offset: "GMT+02:00", city: "Athens" },
  { value: "Europe/Helsinki", label: "GMT+02:00 - Helsinki", offset: "GMT+02:00", city: "Helsinki" },
  { value: "Africa/Cairo", label: "GMT+02:00 - Cairo", offset: "GMT+02:00", city: "Cairo" },
  { value: "Europe/Moscow", label: "GMT+03:00 - Moscow", offset: "GMT+03:00", city: "Moscow" },
  { value: "Asia/Dubai", label: "GMT+04:00 - Dubai", offset: "GMT+04:00", city: "Dubai" },
  { value: "Asia/Karachi", label: "GMT+05:00 - Karachi", offset: "GMT+05:00", city: "Karachi" },
  { value: "Asia/Kolkata", label: "GMT+05:30 - India", offset: "GMT+05:30", city: "Mumbai" },
  { value: "Asia/Dhaka", label: "GMT+06:00 - Bangladesh", offset: "GMT+06:00", city: "Dhaka" },
  { value: "Asia/Bangkok", label: "GMT+07:00 - Bangkok", offset: "GMT+07:00", city: "Bangkok" },
  { value: "Asia/Singapore", label: "GMT+08:00 - Singapore", offset: "GMT+08:00", city: "Singapore" },
  { value: "Asia/Shanghai", label: "GMT+08:00 - China", offset: "GMT+08:00", city: "Shanghai" },
  { value: "Asia/Hong_Kong", label: "GMT+08:00 - Hong Kong", offset: "GMT+08:00", city: "Hong Kong" },
  { value: "Asia/Taipei", label: "GMT+08:00 - Taiwan", offset: "GMT+08:00", city: "Taipei" },
  { value: "Asia/Manila", label: "GMT+08:00 - Philippines", offset: "GMT+08:00", city: "Manila" },
  { value: "Asia/Tokyo", label: "GMT+09:00 - Japan", offset: "GMT+09:00", city: "Tokyo" },
  { value: "Asia/Seoul", label: "GMT+09:00 - South Korea", offset: "GMT+09:00", city: "Seoul" },
  { value: "Australia/Sydney", label: "GMT+10:00 - Sydney", offset: "GMT+10:00", city: "Sydney" },
  { value: "Australia/Melbourne", label: "GMT+10:00 - Melbourne", offset: "GMT+10:00", city: "Melbourne" },
  { value: "Pacific/Auckland", label: "GMT+12:00 - New Zealand", offset: "GMT+12:00", city: "Auckland" },
  { value: "Pacific/Fiji", label: "GMT+12:00 - Fiji", offset: "GMT+12:00", city: "Fiji" },
]

export const DEFAULT_TIMEZONE = "America/New_York"

export const FILE_UPLOAD_CONFIG = {
  maxSize: 25 * 1024 * 1024, // 25MB
  acceptedTypes: {
    "text/plain": [".txt"],
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "image/*": [".png", ".jpg", ".jpeg", ".heic"],
  }
} 