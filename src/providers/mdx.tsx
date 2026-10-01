import type { PropsWithChildren } from "react";

import { MDXProvider } from "@mdx-js/react";
import { MDXContentProps } from "../import-and-require.mdx";

function Code(props) {
  console.log(`props`, props);

  return null;
}

const mdxComponents: MDXContentProps["components"] = {
  // code: Code,
};

function Provider({ children }: PropsWithChildren) {
  return <MDXProvider components={mdxComponents}>{children}</MDXProvider>;
}

export default Provider;
