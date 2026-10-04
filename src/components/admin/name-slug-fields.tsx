"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/admin/fields";
import { slugify } from "@/lib/format";

/** Name + web address. The address follows the name until the owner edits it by hand. */
export function NameSlugFields({
  initialName = "",
  initialSlug = "",
  nameLabel,
  slugHint,
  autoFollow,
}: {
  initialName?: string;
  initialSlug?: string;
  nameLabel: string;
  slugHint: string;
  /** Turn off when editing an existing item so its address (URL) never changes by accident. */
  autoFollow: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const touched = useRef(!autoFollow || initialSlug !== "");

  return (
    <>
      <Field label={nameLabel} htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          maxLength={200}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!touched.current) setSlug(slugify(e.target.value));
          }}
        />
      </Field>
      <Field label="Web address (slug)" htmlFor="slug" hint={slugHint}>
        <Input
          id="slug"
          name="slug"
          maxLength={120}
          value={slug}
          onChange={(e) => {
            touched.current = true;
            setSlug(e.target.value.toLowerCase());
          }}
        />
      </Field>
    </>
  );
}
