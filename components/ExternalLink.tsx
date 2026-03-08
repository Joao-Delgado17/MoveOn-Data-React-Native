import React from "react";
import { Link } from "expo-router";
import type { Href } from "expo-router";

type Props = {
  href: Href;
  children: React.ReactNode;
};

export default function ExternalLink({ href, children }: Props) {
  return <Link href={href}>{children}</Link>;
}