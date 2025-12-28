import { GithubIcon } from "lucide-react";
import Image from "next/image";
import FL_IMG from "@/public/fl-stamp.png";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="pb-4 w-full max-w-6xl mx-auto flex flex-row-reverse gap-4 items-center justify-between">
      <Link
        // TODO: Replace with feldgrau labs website
        href='https://github.com/FeldgrauLabs/sharewave'
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image src={FL_IMG} alt='product of feldgrau labs' width={96} height={96} />
      </Link>
    </footer>
  );
}