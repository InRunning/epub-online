import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { InspectorDev } from "./inspector";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EPUB阅读器 - 本地EPUB文件阅读管理",
  description: "一个基于Next.js的本地EPUB阅读器，支持文件上传、阅读进度管理、主题设置等功能",
  keywords: "EPUB, 阅读器, 电子书, Next.js, React",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <InspectorDev />
      </body>
    </html>
  );
}