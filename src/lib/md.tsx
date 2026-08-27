import { Fragment } from 'react';

// **bold** spans in changelog/mission text → <b>.
export function md(text: string) {
  return text
    .split(/\*\*/)
    .map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>));
}
