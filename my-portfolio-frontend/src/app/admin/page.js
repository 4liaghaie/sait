"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { apiUrl } from "@/lib/api";

function Section({ title, description, children }) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ChipList({ items, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge
          key={item.id}
          variant="secondary"
          className="cursor-pointer hover:bg-primary/10"
          onClick={() => onSelect(item)}
        >
          {item.label}
        </Badge>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [aboutEn, setAboutEn] = useState("");
  const [aboutTr, setAboutTr] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [references, setReferences] = useState([]);
  const [translations, setTranslations] = useState("");

  const [catForm, setCatForm] = useState({
    id: "",
    title_en: "",
    title_tr: "",
    description_en: "",
    description_tr: "",
    position: 0,
    active: true,
  });
  const [imgForm, setImgForm] = useState({
    id: "",
    title: "",
    alt: "",
    home: false,
    remoteUrl: "",
    categoryIds: [],
    referenceIds: [],
  });
  const [imgFile, setImgFile] = useState(null);
  const [refForm, setRefForm] = useState({
    id: "",
    title_en: "",
    title_tr: "",
    description_en: "",
    description_tr: "",
    year: "",
    imageIds: [],
    remoteLogoLight: "",
    remoteLogoDark: "",
    logoLightFile: null,
    logoDarkFile: null,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoAlt, setLogoAlt] = useState("");
  const [logoRemote, setLogoRemote] = useState("");

  const authedHeaders = useMemo(
    () => (token ? { Authorization: "Bearer " + token } : {}),
    [token]
  );

  const showStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 3000);
  };

  const fetchJson = async (url, opts = {}) => {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const loadAbout = async () => {
    const json = await fetchJson(apiUrl("/api/about"));
    setAboutEn(json?.data?.translations?.en || "");
    setAboutTr(json?.data?.translations?.tr || "");
  };

  const loadLogo = async () => {
    const json = await fetchJson(apiUrl("/api/logo"));
    setLogoPreview(json?.data?.img?.url || "");
    setLogoAlt(json?.data?.translations?.en || "");
  };

  const loadCategories = async () => {
    const json = await fetchJson(apiUrl("/api/categories"));
    setCategories(json.data || []);
  };

  const loadImages = async () => {
    const json = await fetchJson(apiUrl("/api/images"));
    setImages(json.data || []);
  };

  const loadReferences = async () => {
    const json = await fetchJson(apiUrl("/api/references"));
    setReferences(json.data || []);
  };

  const loadTranslations = async () => {
    const json = await fetchJson("/admin/translations");
    setTranslations(JSON.stringify(json.translations || {}, null, 2));
  };

  const loadAll = async () => {
    await Promise.all([
      loadAbout(),
      loadLogo(),
      loadCategories(),
      loadImages(),
      loadReferences(),
      loadTranslations(),
    ]);
  };

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
    if (stored) setToken(stored);
    loadAbout();
    loadLogo();
    loadCategories();
    loadImages();
    loadReferences();
    loadTranslations();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const password = new FormData(e.target).get("password") || "";
    try {
      const json = await fetchJson(apiUrl("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      setToken(json.token);
      if (typeof window !== "undefined")
        localStorage.setItem("adminToken", json.token);
      showStatus("Logged in");
      loadAll();
    } catch (err) {
      showStatus("Login failed");
    }
  };

  const saveAbout = async () => {
    await fetchJson(apiUrl("/admin/about"), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authedHeaders },
      body: JSON.stringify({ translations: { en: aboutEn, tr: aboutTr } }),
    });
    showStatus("About saved");
  };

  const saveLogo = async () => {
    const fd = new FormData();
    if (logoFile) fd.append("img", logoFile);
    if (logoRemote) fd.append("remoteUrl", logoRemote);
    fd.append("alt_en", logoAlt);
    fd.append("alt_tr", logoAlt);
    await fetchJson(apiUrl("/admin/logo"), {
      method: "POST",
      headers: { ...authedHeaders },
      body: fd,
    });
    showStatus("Logo saved");
    setLogoFile(null);
    setLogoRemote("");
    loadLogo();
  };

  const saveCategory = async () => {
    const payload = {
      title: { en: catForm.title_en, tr: catForm.title_tr },
      description: { en: catForm.description_en, tr: catForm.description_tr },
      position: Number(catForm.position) || 0,
      is_active: !!catForm.active,
    };
    const url = catForm.id
      ? apiUrl(`/admin/categories/${catForm.id}`)
      : apiUrl("/admin/categories");
    const method = catForm.id ? "PATCH" : "POST";
    await fetchJson(url, {
      method,
      headers: { "Content-Type": "application/json", ...authedHeaders },
      body: JSON.stringify(payload),
    });
    showStatus("Category saved");
    setCatForm({
      id: "",
      title_en: "",
      title_tr: "",
      description_en: "",
      description_tr: "",
      position: 0,
      active: true,
    });
    loadCategories();
    loadImages();
  };

  const deleteCategory = async () => {
    if (!catForm.id) return;
    await fetchJson(apiUrl(`/admin/categories/${catForm.id}`), {
      method: "DELETE",
      headers: authedHeaders,
    });
    showStatus("Category deleted");
    setCatForm({
      id: "",
      title_en: "",
      title_tr: "",
      description_en: "",
      description_tr: "",
      position: 0,
      active: true,
    });
    loadCategories();
    loadImages();
  };

  const saveImage = async () => {
    const fd = new FormData();
    fd.append("title_en", imgForm.title);
    fd.append("title_tr", imgForm.title);
    fd.append("alt_en", imgForm.alt);
    fd.append("alt_tr", imgForm.alt);
    fd.append("home", imgForm.home ? "true" : "false");
    fd.append("categories", (imgForm.categoryIds || []).join(","));
    fd.append("references", (imgForm.referenceIds || []).join(","));
    if (imgFile) fd.append("image", imgFile);
    if (imgForm.remoteUrl) fd.append("remoteUrl", imgForm.remoteUrl);
    const url = imgForm.id
      ? apiUrl(`/admin/images/${imgForm.id}`)
      : apiUrl("/admin/images");
    const method = imgForm.id ? "PATCH" : "POST";
    await fetchJson(url, {
      method,
      headers: authedHeaders,
      body: fd,
    });
    showStatus("Image saved");
    setImgFile(null);
    setImgForm({
      id: "",
      title: "",
      alt: "",
      home: false,
      remoteUrl: "",
      categoryIds: [],
      referenceIds: [],
    });
    loadImages();
  };

  const saveReference = async () => {
    const fd = new FormData();
    fd.append("title_en", refForm.title_en);
    fd.append("title_tr", refForm.title_tr);
    fd.append("description_en", refForm.description_en);
    fd.append("description_tr", refForm.description_tr);
    fd.append("year", refForm.year || "");
    fd.append("images", (refForm.imageIds || []).join(","));
    if (refForm.logoLightFile) fd.append("logo_light", refForm.logoLightFile);
    if (refForm.logoDarkFile) fd.append("logo_dark", refForm.logoDarkFile);
    if (refForm.remoteLogoLight)
      fd.append("remoteLogoLight", refForm.remoteLogoLight);
    if (refForm.remoteLogoDark)
      fd.append("remoteLogoDark", refForm.remoteLogoDark);
    const url = refForm.id
      ? apiUrl(`/admin/references/${refForm.id}`)
      : apiUrl("/admin/references");
    const method = refForm.id ? "PATCH" : "POST";
    await fetchJson(url, {
      method,
      headers: authedHeaders,
      body: fd,
    });
    showStatus("Reference saved");
    setRefForm({
      id: "",
      title: "",
      description: "",
      year: "",
      imageIds: [],
      remoteLogoLight: "",
      remoteLogoDark: "",
    });
    loadReferences();
  };

  const saveTranslations = async () => {
    const body = { translations: JSON.parse(translations || "{}") };
    await fetchJson("/api/admin/translations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    showStatus("Translations saved");
  };

  const selectedImage = images.find((i) => i.id === imgForm.id);
  const selectedReference = references.find((r) => r.id === refForm.id);
  const loggedIn = !!token;

  if (!loggedIn) {
    return (
      <div className="container mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold">Admin Console</h1>
            <p className="text-muted-foreground">
              Authenticate to manage content.
            </p>
          </div>
          {status ? (
            <Badge variant="outline" className="text-xs">
              {status}
            </Badge>
          ) : null}
        </div>
        <Tabs defaultValue="login" className="space-y-4">
          <TabsList className="bg-muted/60">
            <TabsTrigger value="login">Access</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Section
              title="Authenticate"
              description="Enter ADMIN_PASSWORD to unlock edits."
            >
              <form className="space-y-3" onSubmit={handleLogin}>
                <div className="grid gap-2 md:w-96">
                  <Label>Password</Label>
                  <Input name="password" type="password" required />
                </div>
                <Button type="submit">Login</Button>
              </form>
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Admin Console</h1>
          <p className="text-muted-foreground">
            Manage content, media, and translations in one place.
          </p>
        </div>
        {status ? (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        ) : null}
      </div>

      <Tabs defaultValue="login" className="space-y-4">
        <TabsList className="bg-muted/60 flex items-center gap-2">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
          <TabsTrigger value="translations">Translations</TabsTrigger>
          <span className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setToken("");
              if (typeof window !== "undefined")
                localStorage.removeItem("adminToken");
              showStatus("Logged out");
            }}
          >
            Logout
          </Button>
        </TabsList>

        <TabsContent value="about">
          <Section title="About" description="Edit EN/TR separately.">
            <div className="space-y-3">
              <Label>About (EN)</Label>
              <Textarea
                value={aboutEn}
                onChange={(e) => setAboutEn(e.target.value)}
                className="min-h-[120px]"
              />
              <Label>About (TR)</Label>
              <Textarea
                value={aboutTr}
                onChange={(e) => setAboutTr(e.target.value)}
                className="min-h-[120px]"
              />
              <Button onClick={saveAbout} disabled={!token}>
                Save About
              </Button>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="logo">
          <Section
            title="Logo"
            description="Upload or link a logo (light/dark handled together)."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Label>Upload file</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
                <Label>Or remote URL</Label>
                <Input
                  value={logoRemote}
                  onChange={(e) => setLogoRemote(e.target.value)}
                  placeholder="https://..."
                />
                <Label>Alt text</Label>
                <Input
                  value={logoAlt}
                  onChange={(e) => setLogoAlt(e.target.value)}
                />
                <Button onClick={saveLogo} disabled={!token}>
                  Save Logo
                </Button>
              </div>
              <div className="flex flex-col gap-3">
                <Label>Current</Label>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-20 w-auto rounded-xl border border-border/60 bg-white/70 p-2"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-muted" />
                )}
              </div>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="categories">
          <Section
            title="Categories"
            description="Create and sort collections. Click a chip to edit."
          >
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title (EN)</Label>
                  <Input
                    value={catForm.title_en}
                    onChange={(e) =>
                      setCatForm((f) => ({ ...f, title_en: e.target.value }))
                    }
                  />
                  <Label>Title (TR)</Label>
                  <Input
                    value={catForm.title_tr}
                    onChange={(e) =>
                      setCatForm((f) => ({ ...f, title_tr: e.target.value }))
                    }
                  />
                  <Label>Description (EN)</Label>
                  <Input
                    value={catForm.description_en}
                    onChange={(e) =>
                      setCatForm((f) => ({
                        ...f,
                        description_en: e.target.value,
                      }))
                    }
                  />
                  <Label>Description (TR)</Label>
                  <Input
                    value={catForm.description_tr}
                    onChange={(e) =>
                      setCatForm((f) => ({
                        ...f,
                        description_tr: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input
                    type="number"
                    value={catForm.position}
                    onChange={(e) =>
                      setCatForm((f) => ({ ...f, position: e.target.value }))
                    }
                  />
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={catForm.active}
                      onCheckedChange={(v) =>
                        setCatForm((f) => ({ ...f, active: v }))
                      }
                    />
                    <Label className="text-sm">Active</Label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={saveCategory} disabled={!token}>
                  {catForm.id ? "Update" : "Create"} Category
                </Button>
                {catForm.id ? (
                  <Button
                    variant="destructive"
                    onClick={deleteCategory}
                    disabled={!token}
                  >
                    Delete
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  onClick={() =>
                    setCatForm({
                      id: "",
                      title_en: "",
                      title_tr: "",
                      description_en: "",
                      description_tr: "",
                      position: 0,
                      active: true,
                    })
                  }
                >
                  Reset
                </Button>
              </div>
              <Separator />
              <ScrollArea className="h-[150px] rounded-md border border-border/60 p-3">
                <ChipList
                  items={(categories || []).map((c) => ({
                    id: c.id,
                    label: `${c.Title} ? pos ${c.position}`,
                  }))}
                  onSelect={(c) => {
                    const found = categories.find((x) => x.id === c.id);
                    if (!found) return;
                    setCatForm({
                      id: found.id,
                      title_en:
                        found.translations?.title?.en || found.Title || "",
                      title_tr: found.translations?.title?.tr || "",
                      description_en:
                        found.translations?.description?.en ||
                        found.Description ||
                        "",
                      description_tr: found.translations?.description?.tr || "",
                      position: found.position ?? 0,
                      active: !!found.is_active,
                    });
                  }}
                />
              </ScrollArea>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="images">
          <Section
            title="Images"
            description="Upload or link images, assign categories/references, toggle home display."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Label>Title</Label>
                <Input
                  value={imgForm.title}
                  onChange={(e) =>
                    setImgForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
                <Label>Alt</Label>
                <Input
                  value={imgForm.alt}
                  onChange={(e) =>
                    setImgForm((f) => ({ ...f, alt: e.target.value }))
                  }
                />
                <Label>Remote URL (optional)</Label>
                <Input
                  value={imgForm.remoteUrl}
                  onChange={(e) =>
                    setImgForm((f) => ({ ...f, remoteUrl: e.target.value }))
                  }
                  placeholder="https://..."
                />
                <Label>Upload file</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImgFile(e.target.files?.[0] || null)}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={imgForm.home}
                    onCheckedChange={(v) =>
                      setImgForm((f) => ({ ...f, home: v }))
                    }
                  />
                  <Label>Show on home</Label>
                </div>
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {(categories || []).map((c) => {
                      const active = imgForm.categoryIds.includes(c.id);
                      return (
                        <Button
                          key={c.id}
                          type="button"
                          variant={active ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => {
                            setImgForm((f) => ({
                              ...f,
                              categoryIds: active
                                ? f.categoryIds.filter((id) => id !== c.id)
                                : [...f.categoryIds, c.id],
                            }));
                          }}
                        >
                          {c.Title}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>References</Label>
                  <div className="flex flex-wrap gap-2">
                    {(references || []).map((r) => {
                      const active = imgForm.referenceIds.includes(r.id);
                      return (
                        <Button
                          key={r.id}
                          type="button"
                          variant={active ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => {
                            setImgForm((f) => ({
                              ...f,
                              referenceIds: active
                                ? f.referenceIds.filter((id) => id !== r.id)
                                : [...f.referenceIds, r.id],
                            }));
                          }}
                        >
                          {r.title}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={saveImage} disabled={!token}>
                    {imgForm.id ? "Update" : "Create"} Image
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setImgForm({
                        id: "",
                        title: "",
                        alt: "",
                        home: false,
                        remoteUrl: "",
                        categoryIds: [],
                        referenceIds: [],
                      })
                    }
                  >
                    Reset
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm">
                  Existing images (click to edit)
                </Label>
                <ScrollArea className="h-[340px] rounded-md border border-border/60 p-3 space-y-3">
                  {(images || []).map((img) => (
                    <Card
                      key={img.id}
                      className={`cursor-pointer ${
                        img.id === imgForm.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() =>
                        setImgForm({
                          id: img.id,
                          title_en:
                            img.translations?.title?.en || img.Title || "",
                          title: img.Title || "",
                          alt: img.alt || "",
                          home: !!img.home,
                          remoteUrl: "",
                          categoryIds: (img.categories || []).map(
                            (c) => c.id || c.documentId || ""
                          ),
                          referenceIds: (img.references || []).map(
                            (r) => r.id || r.documentId || ""
                          ),
                        })
                      }
                    >
                      <CardContent className="flex items-center gap-3 p-3">
                        {img.image?.url ? (
                          <img
                            src={img.image.url}
                            alt={img.alt || ""}
                            className="h-14 w-14 rounded-md object-cover border"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-md bg-muted" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">
                            {img.Title || "Untitled"}
                          </p>
                        </div>
                        {img.home ? (
                          <Badge variant="secondary">Home</Badge>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="references">
          <Section
            title="References"
            description="Add client references with logos and linked images."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Label>Title (EN)</Label>
                <Input
                  value={refForm.title_en}
                  onChange={(e) =>
                    setRefForm((f) => ({ ...f, title_en: e.target.value }))
                  }
                />
                <Label>Title (TR)</Label>
                <Input
                  value={refForm.title_tr}
                  onChange={(e) =>
                    setRefForm((f) => ({ ...f, title_tr: e.target.value }))
                  }
                />
                <Label>Description (EN)</Label>
                <Input
                  value={refForm.description_en}
                  onChange={(e) =>
                    setRefForm((f) => ({
                      ...f,
                      description_en: e.target.value,
                    }))
                  }
                />
                <Label>Description (TR)</Label>
                <Input
                  value={refForm.description_tr}
                  onChange={(e) =>
                    setRefForm((f) => ({
                      ...f,
                      description_tr: e.target.value,
                    }))
                  }
                />
                <Label>Year</Label>
                <Input
                  value={refForm.year}
                  onChange={(e) =>
                    setRefForm((f) => ({ ...f, year: e.target.value }))
                  }
                />
                <Label>Images</Label>
                <div className="flex flex-wrap gap-2">
                  {(images || []).map((img) => {
                    const active = refForm.imageIds.includes(img.id);
                    return (
                      <Button
                        key={img.id}
                        type="button"
                        variant={active ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          setRefForm((f) => ({
                            ...f,
                            imageIds: active
                              ? f.imageIds.filter((id) => id !== img.id)
                              : [...f.imageIds, img.id],
                          }));
                        }}
                      >
                        {img.Title || img.id}
                      </Button>
                    );
                  })}
                </div>
                <Label>Logo light file</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setRefForm((f) => ({
                      ...f,
                      logoLightFile: e.target.files?.[0] || null,
                    }))
                  }
                />
                <Label>Logo dark file</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setRefForm((f) => ({
                      ...f,
                      logoDarkFile: e.target.files?.[0] || null,
                    }))
                  }
                />
                <Label>Logo light URL</Label>
                <Input
                  value={refForm.remoteLogoLight}
                  onChange={(e) =>
                    setRefForm((f) => ({
                      ...f,
                      remoteLogoLight: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
                <Label>Logo dark URL</Label>
                <Input
                  value={refForm.remoteLogoDark}
                  onChange={(e) =>
                    setRefForm((f) => ({
                      ...f,
                      remoteLogoDark: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
                <div className="flex gap-3">
                  <Button onClick={saveReference} disabled={!token}>
                    {refForm.id ? "Update" : "Create"} Reference
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setRefForm({
                        id: "",
                        title_en: "",
                        title_tr: "",
                        description_en: "",
                        description_tr: "",
                        year: "",
                        imageIds: [],
                        remoteLogoLight: "",
                        remoteLogoDark: "",
                      })
                    }
                  >
                    Reset
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Existing references (click to edit)</Label>
                <ScrollArea className="h-[320px] rounded-md border border-border/60 p-3 space-y-3">
                  {(references || []).map((ref) => (
                    <Card
                      key={ref.id}
                      className={`cursor-pointer ${
                        ref.id === refForm.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() =>
                        setRefForm({
                          id: ref.id,
                          title: ref.title || "",
                          description: ref.description || "",
                          year: ref.year || "",
                          imageIds: (ref.images || []).map(
                            (i) => i.id || i.documentId || ""
                          ),
                          remoteLogoLight: "",
                          remoteLogoDark: "",
                        })
                      }
                    >
                      <CardContent className="flex items-center gap-3 p-3">
                        <div className="flex-1">
                          <p className="font-medium">
                            {ref.title || "Untitled"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ref.year}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="translations">
          <Section
            title="Translations"
            description="Edit the translations.js object (both languages). JSON format expected."
          >
            <Textarea
              className="font-mono text-sm min-h-[360px]"
              value={translations}
              onChange={(e) => setTranslations(e.target.value)}
            />
            <div className="flex gap-3">
              <Button onClick={saveTranslations}>Save translations.js</Button>
              <Button variant="secondary" onClick={loadTranslations}>
                Reload
              </Button>
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
