export default function fillZero(text: string | number): string {
  return String(+text < 10 ? `0${text}` : text)
}
