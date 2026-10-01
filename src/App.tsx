import { Outlet } from "@tanstack/react-router";
import MDXProvider from "./providers/mdx";

function Layout() {
  return (
    <div className="w-full h-full flex">
      <div className="border-r-1 border-zinc-950">catalog</div>
      <div className="border-r-1 border-zinc-950">files</div>
      <div className="overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  return (
    <MDXProvider>
      <Layout />
    </MDXProvider>
  );
}

export default App;
