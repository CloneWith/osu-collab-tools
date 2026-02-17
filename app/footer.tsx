"use client";

import Logo from "@/components/logo";
import Link from "next/link";
import { common } from "@/app/common";
import { SiGithub, SiNetlify } from "@icons-pack/react-simple-icons";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const {t} = useTranslation("navbar");

  return <footer className="bg-gray-900 text-white py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <Logo/>
            <span className="text-xl font-bold">Collab Tools</span>
          </div>
          <p className="text-gray-400 mb-4">{t("home:hero.description")}</p>
          <div className="flex flex-row items-center space-x-2 mb-4">
            <Link href={common.repoUrl}
                  className="hover:text-white transition-colors text-gray-400 flex flex-row items-center space-x-2">
              <SiGithub/>
              <span>{t("viewOnGitHub")}</span>
            </Link>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">{t("toolsTitle")}</h3>
          <ul className="space-y-2 text-gray-400">
            <li>
              <Link href="/avatar" className="hover:text-white transition-colors">
                {t("nav.avatar")}
              </Link>
            </li>
            <li>
              <Link href="/imagemap" className="hover:text-white transition-colors">
                {t("nav.imagemap")}
              </Link>
            </li>
            <li>
              <Link href="/docs" className="hover:text-white transition-colors">
                {t("nav.docs")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">{t("externalProjects")}</h3>
          <ul className="space-y-2 text-gray-400">
            <li>
              <Link href="https://exsper.github.io/colorcode" className="hover:text-white transition-colors">
                {t("external.colorcode")}
              </Link>
            </li>
            <li>
              <Link href="https://mobe.deno.dev" className="hover:text-white transition-colors">
                {t("external.mobe")}
              </Link>
            </li>
            <li>
              <Link href="https://netlify.com"
                    className="hover:text-white transition-colors flex flex-row space-x-2">
                <SiNetlify/>
                <span>{t("hostedByNetlify")}</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2025-2026 CloneWith</p>
      </div>
    </div>
  </footer>;
}
