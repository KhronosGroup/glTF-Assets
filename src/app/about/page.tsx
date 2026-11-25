import type { Metadata } from "next";
import fs from 'fs';
import { marked } from "marked";

export const metadata: Metadata = {
  title: "About | Sample Assets | Khronos",
  description: "Khronos Sample Assets Website",
};

export default function About() {
    const string = fs.readFileSync("./src/data/ABOUT.md", 'utf8')

    const html = marked.parse(string, { async: false });
    
    return <div style={{margin: "auto", maxWidth: "1280px", padding:'2em 0'}} dangerouslySetInnerHTML={{ __html: html }} />
}