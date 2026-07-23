import { format } from "date-fns";
import { pl } from "date-fns/locale";

const dateFormat = (
  date: Date | string,
  pattern: string = "d MMMM yyyy",
): string => {
  const dateObj = new Date(date);
  const output = format(dateObj, pattern, { locale: pl });
  return output;
};

export default dateFormat;
