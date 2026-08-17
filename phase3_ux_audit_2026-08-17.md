# Phase 3 UX audit

## Web pages
AccountCollectionPage.js
AdminPage.js
AuctionsPage.js
Auth.js
CategoryPage.js
ChatPage.js
DealsPage.js
DownloadPage.js
FlightsPage.js
HomePage.js
ListingDetail.js
NotificationsPage.js
PostListing.js
ProfilePage.js
ReelsPage.js
SearchAndMap.js
SellerStorefrontPage.js
SnapAuthCallback.js
StaticPages.js
VerifyEmailPage.js
WalletPage.js
WorkflowPage.js
XAuthCallback.js

## Web components
frontend/src/components/AIAssistantWidget.js
frontend/src/components/AnimalsEquipmentBoxes.js
frontend/src/components/AuctionsServicesBoxes.js
frontend/src/components/AuthCallback.js
frontend/src/components/CategoryCascades.js
frontend/src/components/CitySelect.js
frontend/src/components/CountryPicker.js
frontend/src/components/CountrySwitcher.js
frontend/src/components/GeoAutocomplete.js
frontend/src/components/ImageViewer.js
frontend/src/components/JobsRealEstateBoxes.js
frontend/src/components/ListingTypeBadge.js
frontend/src/components/LocationPicker.jsx
frontend/src/components/Model3DViewer.js
frontend/src/components/NotificationBell.js
frontend/src/components/NotificationsPanel.js
frontend/src/components/PriceBadge.js
frontend/src/components/SEO.js
frontend/src/components/SmartAppBanner.js
frontend/src/components/SplashScreen.js
frontend/src/components/VoiceCallModal.js
frontend/src/components/layout/BottomNav.js
frontend/src/components/layout/TopBar.js
frontend/src/components/listings/AdSlot.js
frontend/src/components/listings/ListingCard.js
frontend/src/components/ui/accordion.jsx
frontend/src/components/ui/alert-dialog.jsx
frontend/src/components/ui/alert.jsx
frontend/src/components/ui/aspect-ratio.jsx
frontend/src/components/ui/avatar.jsx
frontend/src/components/ui/badge.jsx
frontend/src/components/ui/breadcrumb.jsx
frontend/src/components/ui/button.jsx
frontend/src/components/ui/calendar.jsx
frontend/src/components/ui/card.jsx
frontend/src/components/ui/carousel.jsx
frontend/src/components/ui/checkbox.jsx
frontend/src/components/ui/collapsible.jsx
frontend/src/components/ui/command.jsx
frontend/src/components/ui/context-menu.jsx
frontend/src/components/ui/dialog.jsx
frontend/src/components/ui/drawer.jsx
frontend/src/components/ui/dropdown-menu.jsx
frontend/src/components/ui/form.jsx
frontend/src/components/ui/hover-card.jsx
frontend/src/components/ui/input-otp.jsx
frontend/src/components/ui/input.jsx
frontend/src/components/ui/label.jsx
frontend/src/components/ui/menubar.jsx
frontend/src/components/ui/navigation-menu.jsx
frontend/src/components/ui/pagination.jsx
frontend/src/components/ui/popover.jsx
frontend/src/components/ui/progress.jsx
frontend/src/components/ui/radio-group.jsx
frontend/src/components/ui/resizable.jsx
frontend/src/components/ui/scroll-area.jsx
frontend/src/components/ui/select.jsx
frontend/src/components/ui/separator.jsx
frontend/src/components/ui/sheet.jsx
frontend/src/components/ui/skeleton.jsx
frontend/src/components/ui/slider.jsx
frontend/src/components/ui/sonner.jsx
frontend/src/components/ui/switch.jsx
frontend/src/components/ui/table.jsx
frontend/src/components/ui/tabs.jsx
frontend/src/components/ui/textarea.jsx
frontend/src/components/ui/toast.jsx
frontend/src/components/ui/toaster.jsx
frontend/src/components/ui/toggle-group.jsx
frontend/src/components/ui/toggle.jsx
frontend/src/components/ui/tooltip.jsx

## Mobile screens
AIAssistantScreen.js
AuctionsScreen.js
AuthScreens.js
ChatScreen.js
FlightsScreen.js
HomeScreen.js
ListingDetailScreen.js
MapScreen.js
MoreScreens.js
OffersScreen.js
OtherScreens.js
PasswordReset.js
PostScreen.js
ProfileScreen.js
ReelsScreen.js
SearchScreen.js
SellerProfile.js
WalletScreen.js
WorkflowScreens.js

## Loading/error/empty/retry markers
frontend/src/pages/AdminPage.js:9:    const { user, loading } = useAuth();
frontend/src/pages/AdminPage.js:14:        if (!loading && (!user || user.role !== "admin")) nav("/");
frontend/src/pages/AdminPage.js:15:    }, [user, loading, nav]);
frontend/src/pages/AdminPage.js:17:    if (loading || !user) return <div className="p-10 text-center font-arabic">{tr("جاري التحميل...")}</div>;
frontend/src/pages/AdminPage.js:88:    const [loading, setLoading] = useState(true);
frontend/src/pages/AdminPage.js:91:    const [error, setError] = useState("");
frontend/src/pages/AdminPage.js:93:        setLoading(true); setError("");
frontend/src/pages/AdminPage.js:100:            setRows([]); setError(e?.response?.data?.detail || tr("تعذر تحميل حالة مزودي الذكاء الاصطناعي"));
frontend/src/pages/AdminPage.js:101:        } finally { setLoading(false); }
frontend/src/pages/AdminPage.js:105:    const saveConfig = async () => { setSaving(true); setSaved(""); try { await api.put("/admin/ai/config", config); setSaved(tr("تم حفظ إعدادات AI")); await load(); } catch (e) { setError(e?.response?.data?.detail || tr("تعذر حفظ إعدادات AI")); } finally { setSaving(false); } };
frontend/src/pages/AdminPage.js:109:            <button onClick={load} className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]" title={tr("تحديث")}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button>
frontend/src/pages/AdminPage.js:111:        {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-sm">{error}</div>}
frontend/src/pages/AdminPage.js:113:        <div className="grid gap-3">{!loading && rows.length === 0 && <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl">{tr("لا يوجد مزود AI مفعّل")}</div>}{rows.map((r) => <article key={r.name} className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-[var(--text)]">{r.name} <span className="text-xs text-[var(--text-muted)]">{r.model || "—"}</span></h3><p className="text-xs text-[var(--text-muted)]">{r.configured ? tr("مهيأ") : tr("غير مهيأ")} · {r.enabled ? tr("مفعّل") : tr("متوقف")}</p></div><span className={`text-xs px-2 py-1 rounded-full ${r.last_status === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-700"}`}>{r.last_status || tr("لم يستخدم بعد")}</span></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs"><div><span className="text-[var(--text-muted)]">{tr("الطلبات")}</span><b className="block font-latin">{r.requests || 0}</b></div><div><span className="text-[var(--text-muted)]">{tr("التوكنات")}</span><b className="block font-latin">{r.total_tokens || 0}</b></div><div><span className="text-[var(--text-muted)]">{tr("الأخطاء")}</span><b className="block font-latin">{r.errors || 0} ({Math.round((r.failure_rate || 0) * 100)}%)</b></div><label><span className="text-[var(--text-muted)]">{tr("الحد اليومي")}</span><input type="number" min="0" value={config.providers?.[r.name]?.daily_limit ?? r.daily_limit ?? ""} onChange={(e) => patchProvider(r.name, { daily_limit: Number(e.target.value) })} className="block w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 font-latin" /></label></div><div className="mt-3 flex flex-wrap items-center gap-3 text-xs"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={config.providers?.[r.name]?.enabled ?? r.enabled} onChange={(e) => patchProvider(r.name, { enabled: e.target.checked })} />{tr("تفعيل")}</label><label className="inline-flex items-center gap-2">{tr("الوزن")}<input type="number" min="1" max="100" value={config.providers?.[r.name]?.weight ?? r.weight ?? 1} onChange={(e) => patchProvider(r.name, { weight: Number(e.target.value) })} className="w-16 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 font-latin" /></label></div>{r.last_error && <p className="text-xs text-red-600 mt-3 break-words">{r.last_error}</p>}</article>)}</div>
frontend/src/pages/AdminPage.js:119:    const [loading, setLoading] = useState(true);
frontend/src/pages/AdminPage.js:120:    const load = useCallback(async () => { setLoading(true); try { const r = await api.get("/buy-requests", { params: { limit: 200 } }); setRows(Array.isArray(r.data) ? r.data : []); } catch (_) { setRows([]); } finally { setLoading(false); } }, []);
frontend/src/pages/AdminPage.js:122:    return <div className="space-y-3" data-testid="admin-buy-requests-panel"><div className="flex items-center justify-between"><div><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("طلبات الشراء")}</h2><p className="text-xs text-[var(--text-muted)]">{tr("طلبات حقيقية مرتبطة بالدولة والفئة والميزانية")}</p></div><button onClick={load} className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button></div><div className="grid gap-3">{!loading && rows.length === 0 && <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl">{tr("لا توجد بيانات بعد")}</div>}{rows.map((r) => <article key={r.id} className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"><div className="flex justify-between gap-3"><h3 className="font-arabic font-bold text-[var(--text)]">{r.title}</h3><span className="text-xs text-[var(--primary)]">{r.status}</span></div><p className="text-sm text-[var(--text-muted)] mt-1">{r.description}</p><div className="text-xs text-[var(--text-muted)] mt-2">{r.country_code} · {r.city || "—"} · {r.category}</div></article>)}</div></div>;
frontend/src/pages/AdminPage.js:127:    const [loading, setLoading] = useState(true);
frontend/src/pages/AdminPage.js:128:    const load = useCallback(async () => { setLoading(true); try { const r = await api.get("/support/tickets"); setRows(Array.isArray(r.data) ? r.data : []); } catch (_) { setRows([]); } finally { setLoading(false); } }, []);
frontend/src/pages/AdminPage.js:130:    return <div className="space-y-3" data-testid="admin-support-panel"><div className="flex items-center justify-between"><div><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("تذاكر الدعم")}</h2><p className="text-xs text-[var(--text-muted)]">{tr("متابعة البلاغات والأسئلة مع سجل الرسائل")}</p></div><button onClick={load} className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button></div><div className="grid gap-3">{!loading && rows.length === 0 && <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl">{tr("لا توجد بيانات بعد")}</div>}{rows.map((r) => <article key={r.id} className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"><div className="flex justify-between gap-3"><h3 className="font-arabic font-bold text-[var(--text)]">{r.subject}</h3><span className="text-xs text-[var(--primary)]">{r.status}</span></div><p className="text-sm text-[var(--text-muted)] mt-1">{r.message}</p><div className="text-xs text-[var(--text-muted)] mt-2">{r.category} · {r.priority} · {r.id}</div></article>)}</div></div>;
frontend/src/pages/AdminPage.js:140:    const [loading, setLoading] = useState(true);
frontend/src/pages/AdminPage.js:142:        setLoading(true);
frontend/src/pages/AdminPage.js:154:        } finally { setLoading(false); }
frontend/src/pages/AdminPage.js:168:            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"><div className="p-4 border-b border-[var(--border)] flex items-center justify-between"><h3 className="font-arabic font-bold">{tr("آخر الجلسات")}</h3><span className="text-xs text-[var(--text-muted)]">{loading ? tr("جاري التحميل...") : `${sessions.length} ${tr("جلسة")}`}</span></div><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-start text-[var(--text-muted)] border-b border-[var(--border)]"><th className="p-3 text-start">{tr("آخر ظهور")}</th><th className="p-3 text-start">{tr("المسار")}</th><th className="p-3 text-start">{tr("الجهاز")}</th><th className="p-3 text-start">{tr("النظام/المتصفح")}</th><th className="p-3 text-start">{tr("الدولة/المصدر")}</th><th className="p-3 text-start">{tr("المدة")}</th></tr></thead><tbody>{sessions.slice(0, 100).map((s) => <tr key={s.session_id} className="border-b border-[var(--border)]/50"><td className="p-3 font-latin whitespace-nowrap">{s.last_seen ? new Date(s.last_seen).toLocaleString() : "—"}</td><td className="p-3 max-w-48 truncate font-mono">{s.last_path || "—"}</td><td className="p-3">{s.device_type || "—"}</td><td className="p-3">{[s.os, s.browser].filter(Boolean).join(" / ") || "—"}</td><td className="p-3 font-latin">{[s.country_code, s.source].filter(Boolean).join(" / ") || "—"}</td><td className="p-3 font-latin">{Math.round(Number(s.duration_ms || 0) / 1000)}s</td></tr>)}{!loading && sessions.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-[var(--text-muted)]">{tr("لا توجد بيانات بعد")}</td></tr>}</tbody></table></div></div>
frontend/src/pages/AdminPage.js:432:    const [loading, setLoading] = useState(true);
frontend/src/pages/AdminPage.js:448:        setLoading(true);
frontend/src/pages/AdminPage.js:452:            .finally(() => setLoading(false));
frontend/src/pages/AdminPage.js:463:    if (loading) return <div className="p-8 text-center font-arabic text-[var(--text-muted)]">{tr("جاري التحميل...")}</div>;
frontend/src/pages/AdminPage.js:464:    if (items.length === 0) return <div className="bg-[var(--surface)] rounded-2xl p-8 text-center border border-[var(--border)] text-[var(--text-muted)] font-arabic-body" data-testid="moderation-empty">{tr("لا توجد إعلانات بانتظار المراجعة ✅")}</div>;
frontend/src/pages/AdminPage.js:499:    const [loading, setLoading] = useState(false);
frontend/src/pages/AdminPage.js:505:        setLoading(true);
frontend/src/pages/AdminPage.js:518:        } finally { setLoading(false); }
frontend/src/pages/AdminPage.js:561:            {loading ? <div className="p-8 text-center font-arabic text-[var(--text-muted)]">{tr("جاري التحميل...")}</div> : (
frontend/src/pages/AdminPage.js:625:    const [loading, setLoading] = useState(false);
frontend/src/pages/AdminPage.js:628:        setLoading(true);
frontend/src/pages/AdminPage.js:629:        try { const { data } = await api.get("/admin/listings/lifecycle", { params: { age_days: ageDays, status, limit: 500 } }); setItems(data?.items || []); setTotal(data?.total || 0); setSelected(new Set()); } catch (_) { setItems([]); setTotal(0); } finally { setLoading(false); }
frontend/src/pages/AdminPage.js:643:        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-arabic-body"><span>{loading ? tr("جاري التحميل...") : `${total} ${tr("إعلان مطابق")}`}</span><button onClick={() => setSelected(new Set(items.map((x) => x.id)))} className="underline">{tr("تحديد الصفحة")}</button></div>
frontend/src/pages/AdminPage.js:644:        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-[var(--border)] text-[var(--text-muted)]"><th className="p-3 text-start">#</th><th className="p-3 text-start">{tr("الإعلان")}</th><th className="p-3 text-start">{tr("الحالة")}</th><th className="p-3 text-start">{tr("تاريخ الإنشاء")}</th><th className="p-3 text-start">{tr("الوسائط")}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-[var(--border)]/50"><td className="p-3"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} /></td><td className="p-3"><Link to={`/listing/${item.id}`} target="_blank" rel="noreferrer" className="font-bold hover:text-[var(--primary)]">{item.title || item.id}</Link></td><td className="p-3">{item.status || "—"}</td><td className="p-3 font-latin">{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</td><td className="p-3 font-latin">{(item.images?.length || 0) + (item.videos?.length || 0)}</td></tr>)}{!loading && items.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)]">{tr("لا توجد إعلانات مطابقة")}</td></tr>}</tbody></table></div></div>
frontend/src/pages/AdminPage.js:651:    const [loadError, setLoadError] = useState("");
frontend/src/pages/AdminPage.js:656:        setLoadError("");
frontend/src/pages/AdminPage.js:659:            .catch(() => { setData(null); setLoadError(tr("تعذر قراءة سلامة البيانات من الخادم")); });
frontend/src/pages/AdminPage.js:674:    if (!data) return <div className="p-6 text-center font-arabic">{loadError || tr("جاري التحميل...")}</div>;
frontend/src/pages/AdminPage.js:727:    const [loading, setLoading] = useState(false);
frontend/src/pages/AdminPage.js:731:        setLoading(true);
frontend/src/pages/AdminPage.js:741:        finally { setLoading(false); }
frontend/src/pages/AdminPage.js:762:            {loading ? <div className="p-6 text-center font-arabic text-[var(--text-muted)]">{tr("جاري التحميل...")}</div> : (
frontend/src/pages/AdminPage.js:810:        api.get(`/admin/users/${userId}`).then(({ data }) => { if (!cancelled) setData(data); }).catch(() => { if (!cancelled) setData({ error: true }); });
frontend/src/pages/AdminPage.js:832:                {!data ? <div className="p-8 text-center font-arabic">{tr("جاري التحميل...")}</div> : data.error ? <div className="p-8 text-center text-red-500 font-arabic-body">{tr("تعذر تحميل البيانات")}</div> : (
frontend/src/pages/AdminPage.js:1070:                            {form.image && <img src={form.image} alt="" className="mt-2 max-h-24 rounded-xl border border-[var(--border)]" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
frontend/src/pages/AdminPage.js:1420:    const [loading, setLoading] = useState(true);
frontend/src/pages/AdminPage.js:1422:        api.get("/admin/logs", { params: { limit: 200 } }).then(({ data }) => setLogs(data || [])).finally(() => setLoading(false));
frontend/src/pages/AdminPage.js:1424:    if (loading) return <div className="p-6 text-center font-arabic">{tr("تحميل...")}</div>;
frontend/src/pages/AdminPage.js:1453:    const [loading, setLoading] = useState(true);
frontend/src/pages/AdminPage.js:1456:        setLoading(true);
frontend/src/pages/AdminPage.js:1463:        } finally { setLoading(false); }
frontend/src/pages/AdminPage.js:1517:            {loading ? (
frontend/src/pages/AuctionsPage.js:3:import api, { formatApiError } from "@/lib/api";
frontend/src/pages/AuctionsPage.js:16:    const [loading, setLoading] = useState(true);
frontend/src/pages/AuctionsPage.js:17:    const [loadError, setLoadError] = useState("");
frontend/src/pages/AuctionsPage.js:26:        setLoadError("");
frontend/src/pages/AuctionsPage.js:29:            .catch(() => { setItems([]); setLoadError(tr("تعذر تحميل المزادات. حاول مرة أخرى.")); })
frontend/src/pages/AuctionsPage.js:30:            .finally(() => setLoading(false));
frontend/src/pages/AuctionsPage.js:76:            {loading ? (
frontend/src/pages/AuctionsPage.js:80:            ) : loadError ? (
frontend/src/pages/AuctionsPage.js:83:                    <p className="text-[var(--text)] font-arabic-body mb-4">{loadError}</p>
frontend/src/pages/AuctionsPage.js:213:        // error instantly without a roundtrip.
frontend/src/pages/AuctionsPage.js:224:            setErr(formatApiError(e.response?.data?.detail) || tr("تعذر إيداع المزايدة"));
frontend/src/pages/Auth.js:6:import api, { formatApiError } from "@/lib/api";
frontend/src/pages/Auth.js:61:    // that would otherwise show a misleading "غير مُعد على الخادم" error.
frontend/src/pages/Auth.js:124:                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
frontend/src/pages/Auth.js:172:            setErr(formatApiError(e.response?.data?.detail) || e.message);
frontend/src/pages/Auth.js:190:                {err && <div data-testid="login-error" className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl p-3 mb-4 font-arabic-body">{err}</div>}
frontend/src/pages/Auth.js:206:                        {busy ? t("loading") : t("login")}
frontend/src/pages/Auth.js:269:            setErr(formatApiError(e.response?.data?.detail) || e.message);
frontend/src/pages/Auth.js:287:                {err && <div data-testid="register-error" className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl p-3 mb-4 font-arabic-body">{err}</div>}
frontend/src/pages/Auth.js:323:                        {busy ? t("loading") : t("register")}
frontend/src/pages/Auth.js:383:                            {busy ? t("loading") : "إرسال رابط الاستعادة"}
frontend/src/pages/Auth.js:460:            setErr(formatApiError(e.response?.data?.detail) || e.message || "حدث خطأ، حاول لاحقاً");
frontend/src/pages/Auth.js:475:                        <button data-testid="reset-submit" disabled={busy || !token} className="w-full bg-[var(--primary)] text-[var(--primary-fg)] py-3 rounded-xl font-bold text-sm font-arabic disabled:opacity-50">{busy ? t("loading") : "حفظ كلمة المرور الجديدة"}</button>
frontend/src/pages/CategoryPage.js:21:    const [loading, setLoading] = useState(true);
frontend/src/pages/CategoryPage.js:52:            setLoading(true);
frontend/src/pages/CategoryPage.js:71:            } catch (_) {} finally { setLoading(false); }
frontend/src/pages/CategoryPage.js:88:    if (!category) return <div className="p-10 text-center font-arabic">{t("loading")}</div>;
frontend/src/pages/CategoryPage.js:146:            {loading ? (
frontend/src/pages/ChatPage.js:225:    const { user, loading: au } = useAuth();
frontend/src/pages/ChatPage.js:401:    const [loadingOlder, setLoadingOlder] = useState(false);
frontend/src/pages/ChatPage.js:435:        // reloading the page. The merge above preserves optimistic outbox rows.
frontend/src/pages/ChatPage.js:444:        if (!activeConvoId || loadingOlder || !hasMoreMessages || messages.length === 0) return;
frontend/src/pages/ChatPage.js:447:        setLoadingOlder(true);
frontend/src/pages/ChatPage.js:455:        finally { setLoadingOlder(false); }
frontend/src/pages/ChatPage.js:456:    }, [activeConvoId, loadingOlder, hasMoreMessages, messages]);
frontend/src/pages/ChatPage.js:676:    if (au) return <div className="p-10 text-center font-arabic">{t("loading")}</div>;
frontend/src/pages/ChatPage.js:729:                                <button onClick={() => { setActiveConvoId(null); setActiveOther(null); }} className="text-[var(--text-muted)] hover:text-[var(--primary)] md:hidden" aria-label={tr("رجوع")}><ChevronRight className="w-5 h-5 rtl:rotate-180" /></button>
frontend/src/pages/ChatPage.js:740:                                <button onClick={() => setStartCall(true)} className="w-9 h-9 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 flex items-center justify-center shrink-0" aria-label={tr("مكالمة صوتية")} data-testid="voice-call-btn">
frontend/src/pages/ChatPage.js:749:                                        <img src={listingCtx.images[0]} alt="" loading="lazy" />
frontend/src/pages/ChatPage.js:793:                                    <button data-testid="chat-scroll-down" onClick={() => scrollToBottom(true)} className="hp-scroll-down" aria-label={tr("النزول")}>
frontend/src/pages/ChatPage.js:807:                                    <button onClick={() => setReplyTo(null)} className="w-6 h-6 rounded-full hover:bg-[var(--surface)] flex items-center justify-center" aria-label="إلغاء"><X className="w-3.5 h-3.5" /></button>
frontend/src/pages/DealsPage.js:13:    const [loading, setLoading] = useState(true);
frontend/src/pages/DealsPage.js:14:    const [error, setError] = useState("");
frontend/src/pages/DealsPage.js:19:        setError("");
frontend/src/pages/DealsPage.js:22:            .catch(() => { setDeals([]); setError(tr("تعذر تحميل الصفقات الحالية")); })
frontend/src/pages/DealsPage.js:23:            .finally(() => setLoading(false));
frontend/src/pages/DealsPage.js:44:            {error ? (
frontend/src/pages/DealsPage.js:45:                <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-8 text-center font-arabic-body">{error}</div>
frontend/src/pages/DealsPage.js:46:            ) : loading ? (
frontend/src/pages/DownloadPage.js:13: *   If the URL is empty we stay on the page and show the QR placeholders.
frontend/src/pages/DownloadPage.js:15: * - Buttons / QR codes for a platform whose env URL is empty render as a
frontend/src/pages/HomePage.js:18:    const [loading, setLoading] = useState(true);
frontend/src/pages/HomePage.js:23:    const [loadingMore, setLoadingMore] = useState(false);
frontend/src/pages/HomePage.js:35:            setLoading(true);
frontend/src/pages/HomePage.js:45:                // Misconfigured/offline backends can return an HTML fallback or an error object.
frontend/src/pages/HomePage.js:72:                console.error("[HomePage] load failed:", e?.message || e, "BACKEND_URL=", process.env.REACT_APP_BACKEND_URL);
frontend/src/pages/HomePage.js:73:            } finally { setLoading(false); }
frontend/src/pages/HomePage.js:80:        if (loadingMore || loading || !hasMore) return;
frontend/src/pages/HomePage.js:87:        setLoadingMore(true);
frontend/src/pages/HomePage.js:97:        finally { setLoadingMore(false); inflightRef.current = false; }
frontend/src/pages/HomePage.js:98:    }, [country, page, hasMore, loadingMore, loading]);
frontend/src/pages/HomePage.js:115:            <NearbySection listings={listings} loading={loading} t={t} layout={layout} setLayout={setLayout} loadingMore={loadingMore} hasMore={hasMore} sentinelRef={sentinelRef} />
frontend/src/pages/HomePage.js:203:function NearbySection({ listings, loading, t, layout, setLayout, loadingMore, hasMore, sentinelRef }) {
frontend/src/pages/HomePage.js:218:            {loading ? (
frontend/src/pages/HomePage.js:247:            {!loading && hasMore && (
frontend/src/pages/HomePage.js:249:                    {loadingMore && (
frontend/src/pages/ListingDetail.js:5:import { Heart, Phone, MessageCircle, MapPin, Eye, Calendar, Share2, Flag, ChevronLeft, Star, ChevronRight, Sparkles, TrendingUp, ShieldAlert, Maximize2, Edit3, RefreshCw, CheckCircle2, Trash2, Bell, Tag, Box, Gavel } from "lucide-react";
frontend/src/pages/ListingDetail.js:66:    const [loadError, setLoadError] = useState("");
frontend/src/pages/ListingDetail.js:73:            setLoadError("");
frontend/src/pages/ListingDetail.js:85:                if (!normalizedListing) throw new Error("invalid_listing_response");
frontend/src/pages/ListingDetail.js:129:            } catch (error) {
frontend/src/pages/ListingDetail.js:132:                    setLoadError(error?.response?.status === 404 ? tr("الإعلان غير موجود") : tr("تعذر تحميل الإعلان"));
frontend/src/pages/ListingDetail.js:163:            <p className="text-[var(--text)] mb-4">{loadError || t("loading")}</p>
frontend/src/pages/ListingDetail.js:164:            {loadError && <Link to="/" className="inline-flex rounded-full bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 font-bold">{tr("العودة للرئيسية")}</Link>}
frontend/src/pages/ListingDetail.js:355:                                        <img src={optimizeImage(img, { w: 160 })} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
frontend/src/pages/ListingDetail.js:630:                                <ShieldAlert className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
frontend/src/pages/ListingDetail.js:642:                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={tr("قدم عرض سعر")}>
frontend/src/pages/ListingDetail.js:646:                            <button type="button" onClick={() => setShowOffer(false)} className="text-[var(--text-muted)] text-xl" aria-label={tr("إغلاق")}>×</button>
frontend/src/pages/PostListing.js:4:import api, { formatApiError } from "@/lib/api";
frontend/src/pages/PostListing.js:24:    const { user, loading } = useAuth();
frontend/src/pages/PostListing.js:52:        if (!loading && !user) nav("/login");
frontend/src/pages/PostListing.js:53:    }, [loading, user, nav]);
frontend/src/pages/PostListing.js:65:    // (otherwise we get a "Cannot access ... before initialization" TDZ error).
frontend/src/pages/PostListing.js:175:    const [uploads, setUploads] = useState([]); // [{ id, name, type, progress, status, url, error }]
frontend/src/pages/PostListing.js:183:            xhr.onerror = () => reject(new Error("network"));
frontend/src/pages/PostListing.js:189:        if (file.size > MAX_IMAGE_BYTES) throw new Error(tr("الصورة أكبر من 15 ميجابايت"));
frontend/src/pages/PostListing.js:218:        if (file.size > MAX_VIDEO_BYTES) throw new Error(tr("الفيديو أكبر من 60 ميجابايت"));
frontend/src/pages/PostListing.js:231:        if (file.size > MAX_MODEL_BYTES) throw new Error(tr("ملف 3D أكبر من 80 ميجابايت"));
frontend/src/pages/PostListing.js:248:            status: "uploading",
frontend/src/pages/PostListing.js:250:            error: null,
frontend/src/pages/PostListing.js:265:                setUploads((u) => u.map((it) => it.id === seed.id ? { ...it, status: "error", error: e?.message || "failed" } : it));
frontend/src/pages/PostListing.js:281:            setUploads((u) => u.filter((it) => it.status === "uploading" || it.status === "error"));
frontend/src/pages/PostListing.js:314:            setErr(formatApiError(e.response?.data?.detail) || e.message || "فشل النشر");
frontend/src/pages/PostListing.js:432:                reader.onerror = reject;
frontend/src/pages/PostListing.js:450:            setErr(formatApiError(e.response?.data?.detail) || tr("فشل تحليل الصورة بالذكاء الاصطناعي"));
frontend/src/pages/PostListing.js:938:                                <div key={u.id} className={`bg-[var(--surface-elevated)] rounded-xl px-3 py-2 border ${u.status === "error" ? "border-red-300" : u.status === "done" ? "border-emerald-300" : "border-[var(--border)]"}`}>
frontend/src/pages/PostListing.js:943:                                            {u.status === "error" ? tr("فشل") : u.status === "done" ? "✓" : `${u.progress}%`}
frontend/src/pages/PostListing.js:948:                                            className={`h-full rounded-full transition-all duration-200 ${u.status === "error" ? "bg-red-500" : u.status === "done" ? "bg-emerald-500" : "bg-[var(--primary)]"}`}
frontend/src/pages/PostListing.js:949:                                            style={{ width: `${u.status === "error" ? 100 : u.progress}%` }}
frontend/src/pages/PostListing.js:952:                                    {u.error && <div className="text-[10px] text-red-500 mt-1 font-arabic-body">{u.error}</div>}
frontend/src/pages/PostListing.js:1109:                        <Check className="w-4 h-4" /> {busy ? t("loading") : t("publish")}
frontend/src/pages/ProfilePage.js:59:    const { user, loading, logout, updateUser } = useAuth();
frontend/src/pages/ProfilePage.js:72:        if (!loading && !user) nav("/login");
frontend/src/pages/ProfilePage.js:73:    }, [loading, user, nav]);
frontend/src/pages/ProfilePage.js:113:    if (loading || !user) return <div className="p-10 text-center font-arabic">{t("loading")}</div>;
frontend/src/pages/ProfilePage.js:387: *   If the URL is empty, the button is greyed and shows "قريباً".
frontend/src/pages/ReelsPage.js:78:            <button data-testid="reels-back-btn" onClick={() => nav(-1)} aria-label={tr("رجوع")} className="absolute top-3 start-3 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur flex items-center justify-center text-white">
frontend/src/pages/ReelsPage.js:81:            <Link to="/post?video=1" data-testid="reels-upload-btn" aria-label={tr("ارفع ستوري فيديو")} className="absolute top-3 end-3 z-30 flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-2 rounded-full shadow-lg hover:scale-105 transition-transform">
frontend/src/pages/ReelsPage.js:98:                                bottom of the reel empty. Primary = view ad,
frontend/src/pages/SearchAndMap.js:104:    const [loading, setLoading] = useState(false);
frontend/src/pages/SearchAndMap.js:128:            setLoading(true);
frontend/src/pages/SearchAndMap.js:146:                // if they bounce. Fire-and-forget; ignore errors for guests / aborts.
frontend/src/pages/SearchAndMap.js:154:            } catch (_) { /* ignore — search aborted or transient network */ } finally { setLoading(false); }
frontend/src/pages/SearchAndMap.js:176:        r.onerror = () => setVoiceActive(false);
frontend/src/pages/SearchAndMap.js:236:            {loading ? (
frontend/src/pages/SearchAndMap.js:257:    const [loading, setLoading] = useState(true);
frontend/src/pages/SearchAndMap.js:258:    const [loadError, setLoadError] = useState("");
frontend/src/pages/SearchAndMap.js:268:        setLoading(true);
frontend/src/pages/SearchAndMap.js:269:        setLoadError("");
frontend/src/pages/SearchAndMap.js:274:                if (!Array.isArray(data) && !Array.isArray(data?.items)) setLoadError(tr("تعذر قراءة بيانات الخريطة"));
frontend/src/pages/SearchAndMap.js:276:            .catch(() => { setItems([]); setLoadError(tr("تعذر تحميل الإعلانات على الخريطة")); })
frontend/src/pages/SearchAndMap.js:277:            .finally(() => setLoading(false));
frontend/src/pages/SearchAndMap.js:310:                {loading && <div className="absolute z-[1000] m-3 rounded-full bg-[var(--surface)]/90 px-3 py-2 text-xs font-arabic shadow">{tr("جاري تحميل الخريطة...")}</div>}
frontend/src/pages/SearchAndMap.js:311:                {loadError && <div className="absolute z-[1000] left-1/2 -translate-x-1/2 mt-3 rounded-xl bg-red-50 text-red-700 px-3 py-2 text-xs font-arabic shadow">{loadError}</div>}
frontend/src/pages/SnapAuthCallback.js:18:        const err = params.get("error");
frontend/src/pages/SnapAuthCallback.js:20:            nav("/login?error=snap", { replace: true });
frontend/src/pages/SnapAuthCallback.js:29:                nav("/login?error=snap", { replace: true });
frontend/src/pages/VerifyEmailPage.js:10:    const [state, setState] = useState("loading"); // loading | ok | err
frontend/src/pages/VerifyEmailPage.js:23:                {state === "loading" && (
frontend/src/pages/WalletPage.js:3:import api, { formatApiError } from "@/lib/api";
frontend/src/pages/WalletPage.js:13:    const [loading, setLoading] = useState(true);
frontend/src/pages/WalletPage.js:18:        setLoading(true);
frontend/src/pages/WalletPage.js:21:            .finally(() => setLoading(false));
frontend/src/pages/WalletPage.js:37:            setMsg(formatApiError(e.response?.data?.detail) || tr("تعذر استلام المكافأة"));
frontend/src/pages/WalletPage.js:117:                {loading ? (
frontend/src/pages/XAuthCallback.js:18:        const err = params.get("error");
frontend/src/pages/XAuthCallback.js:20:            nav("/login?error=x", { replace: true });
frontend/src/pages/XAuthCallback.js:29:                nav("/login?error=x", { replace: true });
frontend/src/pages/SellerStorefrontPage.js:11:    const [loading, setLoading] = useState(true);
frontend/src/pages/SellerStorefrontPage.js:17:            .finally(() => { if (active) setLoading(false); });
frontend/src/pages/SellerStorefrontPage.js:20:    if (loading) return <div className="min-h-[60vh] flex items-center justify-center font-arabic">{tr("جاري التحميل...")}</div>;
frontend/src/pages/SellerStorefrontPage.js:41:            <section><div className="flex items-center justify-between mb-3"><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("كتالوج المتجر")}</h2><span className="text-xs text-[var(--text-muted)] font-arabic-body">{items.length} {tr("إعلان")}</span></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">{items.map((item) => <Link key={item.id} to={`/listing/${item.id}`} className="bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] hover:-translate-y-0.5 hover:shadow-lg transition-all"><div className="aspect-[4/3] bg-[var(--surface-elevated)]">{item.images?.[0] && <img src={item.images[0]} alt={item.title || ""} className="w-full h-full object-cover" loading="lazy" />}</div><div className="p-3"><div className="font-arabic font-bold text-sm text-[var(--text)] line-clamp-2 min-h-10">{item.title}</div><div className="mt-2 flex justify-between gap-2 text-xs"><b className="font-latin text-[var(--primary)]">{item.price ? `${Number(item.price).toLocaleString()} ${item.currency || ""}` : tr("السعر عند التواصل")}</b><span className="text-[var(--text-muted)]">{item.views || 0} {tr("مشاهدة")}</span></div></div></Link>)}</div>{items.length === 0 && <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center text-[var(--text-muted)] font-arabic-body">{tr("لا توجد إعلانات نشطة")}</div>}</section>
frontend/src/pages/NotificationsPage.js:19:    const [loading, setLoading] = useState(true);
frontend/src/pages/NotificationsPage.js:20:    const load = useCallback(async () => { if (!user) return; setLoading(true); try { const { data } = await api.get("/notifications", { params: { limit: 100 } }); setItems(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])); } catch (_) { setItems([]); } finally { setLoading(false); } }, [user]);
frontend/src/pages/NotificationsPage.js:25:    return <main className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-6 pb-24 overflow-x-hidden" dir={direction} data-testid="notifications-page"><div className="flex items-center justify-between mb-5"><div><h1 className="font-arabic font-black text-2xl text-[var(--text)] flex items-center gap-2"><Bell className="w-6 h-6 text-[var(--primary)]" />{tr("الإشعارات")}</h1><p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{tr("رسائل فورية، عروض، تحديثات الإعلانات والتنبيهات المهمة")}</p></div>{items.some((n) => !n.read) && <button onClick={markAll} className="px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-arabic font-bold flex items-center gap-1"><CheckCheck className="w-4 h-4" />{tr("تعليم الكل كمقروء")}</button>}</div>{loading ? <div className="py-16 text-center text-[var(--text-muted)] font-arabic-body">{tr("جاري التحميل...")}</div> : items.length === 0 ? <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center text-[var(--text-muted)] font-arabic-body"><Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />{tr("لا توجد إشعارات بعد")}</div> : <div className="w-full max-w-2xl mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">{items.map((n) => { const Icon = ICONS[n.type] || Bell; return <Link key={n.id} to={notificationUrl(n)} onClick={() => !n.read && markOne(n.id)} className={`flex gap-3 p-4 min-w-0 overflow-hidden border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-elevated)] ${!n.read ? "bg-[var(--primary)]/5" : ""}`}><div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center shrink-0 text-[var(--primary)]"><Icon className="w-5 h-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2 min-w-0"><h2 className="font-arabic font-bold text-sm text-[var(--text)] truncate min-w-0">{n.title}</h2>{!n.read && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}</div>{n.body && <p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{n.body}</p>}<time className="block text-[10px] text-[var(--text-muted)] mt-2">{new Date(n.created_at || n.ts).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}</time></div>{!n.read && <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />}</Link>; })}</div>}</main>;
frontend/src/pages/AccountCollectionPage.js:33:  const [error, setError] = useState("");
frontend/src/pages/AccountCollectionPage.js:45:    setError("");
frontend/src/pages/AccountCollectionPage.js:51:      setError(err?.response?.data?.detail || t("تعذر تحميل البيانات"));
frontend/src/pages/AccountCollectionPage.js:69:        <button onClick={load} disabled={busy} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] disabled:opacity-50" aria-label={t("تحديث")}><RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /></button>
frontend/src/pages/AccountCollectionPage.js:72:      {error && <div className="mb-4 rounded-2xl border border-red-300/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-4 text-sm font-arabic-body">{error}</div>}
frontend/src/pages/AccountCollectionPage.js:74:      {!busy && !error && rows.length === 0 && <div className="py-20 text-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]"><Search className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" /><p className="font-arabic font-bold text-[var(--text)]">{t("لا توجد بيانات بعد")}</p><Link to="/" className="inline-flex mt-4 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-fg)] font-arabic font-bold text-sm">{t("استكشف الإعلانات")}</Link></div>}
frontend/src/pages/AccountCollectionPage.js:81:      {!busy && otherRows.length > 0 && <div className="space-y-3 mt-2">{otherRows.map((row, index) => <div key={row.id || row.search_id || row.user_id || index} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between gap-3"><div className="min-w-0"><p className="font-arabic font-bold text-[var(--text)] truncate">{row.name || row.title || row.query || row.keyword || t("عنصر محفوظ")}</p><p className="text-xs text-[var(--text-muted)] font-arabic-body truncate">{row.description || row.city || row.country_code || row.status || ""}</p></div>{(row.listing_id || row.id) && config.key === "offers" && <Link to={`/listing/${row.listing_id || row.id}`} className="shrink-0 p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]" aria-label={t("فتح الإعلان")}><ExternalLink className="w-4 h-4" /></Link>}</div>)}</div>}
frontend/src/pages/WorkflowPage.js:14:  const [loading, setLoading] = useState(true);
frontend/src/pages/WorkflowPage.js:18:    setLoading(true); setMessage("");
frontend/src/pages/WorkflowPage.js:21:    finally { setLoading(false); }
frontend/src/pages/WorkflowPage.js:33:    <div className="flex items-center justify-between gap-3 mb-5"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-[var(--primary)]/12 text-[var(--primary)] flex items-center justify-center">{isBuy ? <ShoppingBag className="w-5 h-5" /> : <LifeBuoy className="w-5 h-5" />}</div><div><h1 className="font-arabic font-black text-xl sm:text-2xl text-[var(--text)]">{t(isBuy ? "طلبات الشراء" : "الدعم والمساعدة")}</h1><p className="text-xs text-[var(--text-muted)]">{t(isBuy ? "اطلب منتجًا أو خدمة من البائعين في الدولة المختارة" : "أنشئ تذكرة وتابع حالتها مع فريق الدعم")}</p></div></div><button onClick={load} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button></div>
frontend/src/pages/WorkflowPage.js:39:    <div className="space-y-3">{!loading && rows.length === 0 && <div className="text-center py-10 text-[var(--text-muted)] font-arabic-body">{t("لا توجد بيانات بعد")}</div>}{rows.map((row) => <article key={row.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-arabic font-bold text-[var(--text)]">{row.title || row.subject}</h2><p className="text-sm text-[var(--text-muted)] mt-1">{row.description || row.message}</p></div><span className="text-xs rounded-full px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)]">{row.status}</span></div><div className="mt-3 text-xs text-[var(--text-muted)]">{row.country_code || row.category || ""} · {row.created_at ? new Date(row.created_at).toLocaleString() : ""}</div></article>)}</div>
frontend/src/components/AIAssistantWidget.js:4:import api, { formatApiError } from "@/lib/api";
frontend/src/components/AIAssistantWidget.js:163:            const errText = formatApiError(e.response?.data?.detail) || tr("تعذر الوصول للمساعد");
frontend/src/components/AIAssistantWidget.js:208:                    aria-label={tr("المساعد الذكي")}
frontend/src/components/AIAssistantWidget.js:221:                    aria-label={tr("إخفاء المساعد")}
frontend/src/components/AuctionsServicesBoxes.js:252:            {/* Empty state hint */}
frontend/src/components/AuthCallback.js:17: *   4. Redirect to home OR show visible error
frontend/src/components/AuthCallback.js:45:    const [status, setStatus] = useState("loading"); // loading | error
frontend/src/components/AuthCallback.js:46:    const [errorMsg, setErrorMsg] = useState("");
frontend/src/components/AuthCallback.js:52:        // 1. Check for explicit error from backend
frontend/src/components/AuthCallback.js:53:        const queryError = searchParams.get("error");
frontend/src/components/AuthCallback.js:56:        const hashError = hashParams.get("error");
frontend/src/components/AuthCallback.js:58:        if (queryError || hashError) {
frontend/src/components/AuthCallback.js:59:            setErrorMsg(queryError || hashError || "unknown");
frontend/src/components/AuthCallback.js:60:            setStatus("error");
frontend/src/components/AuthCallback.js:71:            setErrorMsg("no_tokens");
frontend/src/components/AuthCallback.js:72:            setStatus("error");
frontend/src/components/AuthCallback.js:89:                // Still navigate home; AuthContext will retry there.
frontend/src/components/AuthCallback.js:96:    if (status === "error") {
frontend/src/components/AuthCallback.js:98:            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4" dir="rtl" data-testid="auth-callback-error">
frontend/src/components/AuthCallback.js:105:                        {errorMsg === "no_tokens"
frontend/src/components/AuthCallback.js:107:                            : errorMsg === "invalid_state"
frontend/src/components/AuthCallback.js:109:                            : errorMsg === "banned"
frontend/src/components/AuthCallback.js:111:                            : `${tr("سبب الخطأ")}: ${errorMsg}`}
frontend/src/components/AuthCallback.js:115:                        data-testid="auth-callback-retry"
frontend/src/components/AuthCallback.js:126:        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]" dir="rtl" data-testid="auth-callback-loading">
frontend/src/components/CitySelect.js:24:    const [loading, setLoading] = useState(false);
frontend/src/components/CitySelect.js:43:            setLoading(true);
frontend/src/components/CitySelect.js:51:            finally { setLoading(false); }
frontend/src/components/CitySelect.js:170:                                {loading && (
frontend/src/components/CitySelect.js:176:                                {!loading && q.length >= 2 && remoteItems.length === 0 && localItems.filter((it) => it.name.includes(q)).length === 0 && (
frontend/src/components/CountryPicker.js:45:                    aria-label={tr("إغلاق")}
frontend/src/components/GeoAutocomplete.js:22:    const [loading, setLoading] = useState(false);
frontend/src/components/GeoAutocomplete.js:39:            setLoading(true);
frontend/src/components/GeoAutocomplete.js:43:                .finally(() => setLoading(false));
frontend/src/components/GeoAutocomplete.js:45:            setLoading(true);
frontend/src/components/GeoAutocomplete.js:49:                .finally(() => setLoading(false));
frontend/src/components/GeoAutocomplete.js:58:            setLoading(true);
frontend/src/components/GeoAutocomplete.js:66:            finally { setLoading(false); }
frontend/src/components/GeoAutocomplete.js:99:            {open && (items.length > 0 || loading) && (
frontend/src/components/GeoAutocomplete.js:101:                    {loading && (
frontend/src/components/GeoAutocomplete.js:122:                    {!loading && items.length === 0 && (
frontend/src/components/ImageViewer.js:118:            <button data-testid="iv-close" onClick={onClose} aria-label={tr("إغلاق")} className="absolute top-3 end-3 w-14 h-14 rounded-full bg-red-500/95 hover:bg-red-500 shadow-2xl text-white flex items-center justify-center z-[110] border-2 border-white/40"><X className="w-7 h-7" /></button>
frontend/src/components/ImageViewer.js:133:                    <button data-testid="iv-prev" onClick={prev} aria-label={tr("السابق")} className="absolute end-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 active:bg-white/40 backdrop-blur text-white flex items-center justify-center shadow-lg z-[105] mt-7"><ChevronRight className="w-6 h-6" /></button>
frontend/src/components/ImageViewer.js:135:                    <button data-testid="iv-next" onClick={next} aria-label={tr("التالي")} className="absolute start-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 active:bg-white/40 backdrop-blur text-white flex items-center justify-center shadow-lg z-[105] mt-7"><ChevronLeft className="w-6 h-6" /></button>
frontend/src/components/LocationPicker.jsx:65:    const [loading, setLoading] = useState(false);
frontend/src/components/LocationPicker.jsx:66:    const [fetchError, setFetchError] = useState("");
frontend/src/components/LocationPicker.jsx:81:            setLoading(true);
frontend/src/components/LocationPicker.jsx:82:            setFetchError("");
frontend/src/components/LocationPicker.jsx:86:                // Strict level filter; if empty, we'll widen below.
frontend/src/components/LocationPicker.jsx:107:                if (!cancelled) { setOptions([]); setFetchError(detail || "network error"); }
frontend/src/components/LocationPicker.jsx:109:                if (!cancelled) setLoading(false);
frontend/src/components/LocationPicker.jsx:161:                        {loading ? (
frontend/src/components/LocationPicker.jsx:166:                        ) : fetchError ? (
frontend/src/components/LocationPicker.jsx:168:                                ⚠️ {tr("خطأ في الاتصال")}: {fetchError}
frontend/src/components/LocationPicker.jsx:203:    const [bootError, setBootError] = useState("");
frontend/src/components/LocationPicker.jsx:206:    // dropdown is never empty.
frontend/src/components/LocationPicker.jsx:216:                if (!cancelled) { setSupportedCountries([]); setBootError(detail || "network"); }
frontend/src/components/LocationPicker.jsx:249:            {bootError && (
frontend/src/components/LocationPicker.jsx:251:                    ⚠️ {tr("لا يمكن الاتصال بخدمة المواقع")}: <code>{bootError}</code> @ <code>{api.defaults.baseURL}</code>
frontend/src/components/NotificationBell.js:44:    const [loading, setLoading] = useState(false);
frontend/src/components/NotificationBell.js:51:        setLoading(true);
frontend/src/components/NotificationBell.js:65:        finally { setLoading(false); }
frontend/src/components/NotificationBell.js:116:                aria-label={tr("الإشعارات")}
frontend/src/components/NotificationBell.js:137:                        {loading && items.length === 0 ? (
frontend/src/components/SmartAppBanner.js:13: * If the env var for the detected platform is empty, the banner hides itself.
frontend/src/components/SmartAppBanner.js:90:                <button data-testid="app-banner-dismiss" onClick={dismiss} aria-label={tr("إغلاق")} className="shrink-0 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
frontend/src/components/layout/BottomNav.js:63:                aria-label={label}
frontend/src/components/layout/BottomNav.js:98:                aria-label={tr("نشر إعلان")}
frontend/src/components/layout/BottomNav.js:125:                    <div className="w-14 h-1 shrink-0" aria-hidden="true"></div>
frontend/src/components/layout/TopBar.js:100:        if (!SR) { setVoicePhase("error"); setVoiceStatus(tr("المتصفح لا يدعم البحث الصوتي؛ جرّب Chrome أو Safari الحديث")); return; }
frontend/src/components/layout/TopBar.js:117:        r.onerror = (e) => { setVoicePhase("error"); setVoiceStatus(e?.error === "not-allowed" ? tr("تم رفض إذن الميكروفون؛ اسمح به من إعدادات المتصفح") : tr("تعذر تشغيل الميكروفون")); };
frontend/src/components/layout/TopBar.js:119:        try { r.start(); } catch (_) { setVoicePhase("error"); setVoiceStatus(tr("تعذر بدء التسجيل")); }
frontend/src/components/layout/TopBar.js:124:        if (!file.type?.startsWith("image/")) { setImagePhase("error"); setImageStatus(tr("اختر ملف صورة صالحًا")); return; }
frontend/src/components/layout/TopBar.js:125:        if (file.size > 8 * 1024 * 1024) { setImagePhase("error"); setImageStatus(tr("حجم الصورة كبير جدًا؛ الحد الأقصى 8MB")); return; }
frontend/src/components/layout/TopBar.js:131:        reader.onerror = () => { setImagePhase("error"); setImageStatus(tr("تعذر قراءة الصورة")); };
frontend/src/components/layout/TopBar.js:136:                if (!q) { setImagePhase("error"); setImageStatus(tr("لم نتمكن من فهم الصورة؛ جرّب صورة أوضح")); return; }
frontend/src/components/layout/TopBar.js:142:                setImagePhase("error");
frontend/src/components/layout/TopBar.js:177:                        {(voiceStatus || imageStatus) && <div className="absolute top-full mt-1 start-0 end-0 z-50 rounded-xl bg-black/85 text-white text-xs px-3 py-2 shadow-lg flex items-center gap-2" role="status" aria-live="polite">{(voicePhase === "listening" || voicePhase === "transcribing" || imagePhase === "processing") && <Loader2 className="inline-block w-3.5 h-3.5 animate-spin shrink-0" />}{imagePreview && imagePhase !== "idle" && <img src={imagePreview} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />}{voiceStatus || imageStatus}</div>}
frontend/src/components/layout/TopBar.js:271:                    <button data-testid="theme-toggle-btn" onClick={() => setOpenMenu(openMenu === "theme" ? null : "theme")} aria-label="Theme" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center border border-white/25 dark:border-white/15 transition-all backdrop-blur">
frontend/src/components/listings/AdSlot.js:54:            <img src={optimizeImage(ad.image_url, { w: 768 })} srcSet={buildSrcSet(ad.image_url, [320, 480, 768, 1024])} sizes="(max-width: 768px) 100vw, 768px" alt={ad.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
frontend/src/components/listings/ListingCard.js:59:                    <img key={images[imageIndex]} src={optimizeImage(images[imageIndex], { w: 480 })} srcSet={buildSrcSet(images[imageIndex], [240, 320, 480, 640])} sizes="(max-width: 640px) 50vw, 240px" alt={listing.title} loading="lazy" decoding="async" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} style={{ opacity: 0, transition: "opacity 280ms ease-out" }} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
frontend/src/components/ui/alert-dialog.jsx:2:import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
frontend/src/components/ui/alert-dialog.jsx:7:const AlertDialog = AlertDialogPrimitive.Root
frontend/src/components/ui/alert-dialog.jsx:9:const AlertDialogTrigger = AlertDialogPrimitive.Trigger
frontend/src/components/ui/alert-dialog.jsx:11:const AlertDialogPortal = AlertDialogPrimitive.Portal
frontend/src/components/ui/alert-dialog.jsx:13:const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/alert-dialog.jsx:14:  <AlertDialogPrimitive.Overlay
frontend/src/components/ui/alert-dialog.jsx:22:AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName
frontend/src/components/ui/alert-dialog.jsx:24:const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/alert-dialog.jsx:25:  <AlertDialogPortal>
frontend/src/components/ui/alert-dialog.jsx:26:    <AlertDialogOverlay />
frontend/src/components/ui/alert-dialog.jsx:27:    <AlertDialogPrimitive.Content
frontend/src/components/ui/alert-dialog.jsx:34:  </AlertDialogPortal>
frontend/src/components/ui/alert-dialog.jsx:36:AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName
frontend/src/components/ui/alert-dialog.jsx:38:const AlertDialogHeader = ({
frontend/src/components/ui/alert-dialog.jsx:46:AlertDialogHeader.displayName = "AlertDialogHeader"
frontend/src/components/ui/alert-dialog.jsx:48:const AlertDialogFooter = ({
frontend/src/components/ui/alert-dialog.jsx:56:AlertDialogFooter.displayName = "AlertDialogFooter"
frontend/src/components/ui/alert-dialog.jsx:58:const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/alert-dialog.jsx:59:  <AlertDialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
frontend/src/components/ui/alert-dialog.jsx:61:AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName
frontend/src/components/ui/alert-dialog.jsx:63:const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/alert-dialog.jsx:64:  <AlertDialogPrimitive.Description
frontend/src/components/ui/alert-dialog.jsx:69:AlertDialogDescription.displayName =
frontend/src/components/ui/alert-dialog.jsx:70:  AlertDialogPrimitive.Description.displayName
frontend/src/components/ui/alert-dialog.jsx:72:const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/alert-dialog.jsx:73:  <AlertDialogPrimitive.Action ref={ref} className={cn(buttonVariants(), className)} {...props} />
frontend/src/components/ui/alert-dialog.jsx:75:AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName
frontend/src/components/ui/alert-dialog.jsx:77:const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/alert-dialog.jsx:78:  <AlertDialogPrimitive.Cancel
frontend/src/components/ui/alert-dialog.jsx:83:AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName
frontend/src/components/ui/alert-dialog.jsx:86:  AlertDialog,
frontend/src/components/ui/alert-dialog.jsx:87:  AlertDialogPortal,
frontend/src/components/ui/alert-dialog.jsx:88:  AlertDialogOverlay,
frontend/src/components/ui/alert-dialog.jsx:89:  AlertDialogTrigger,
frontend/src/components/ui/alert-dialog.jsx:90:  AlertDialogContent,
frontend/src/components/ui/alert-dialog.jsx:91:  AlertDialogHeader,
frontend/src/components/ui/alert-dialog.jsx:92:  AlertDialogFooter,
frontend/src/components/ui/alert-dialog.jsx:93:  AlertDialogTitle,
frontend/src/components/ui/alert-dialog.jsx:94:  AlertDialogDescription,
frontend/src/components/ui/alert-dialog.jsx:95:  AlertDialogAction,
frontend/src/components/ui/alert-dialog.jsx:96:  AlertDialogCancel,
frontend/src/components/ui/alert.jsx:22:const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
frontend/src/components/ui/alert.jsx:29:Alert.displayName = "Alert"
frontend/src/components/ui/alert.jsx:31:const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/alert.jsx:37:AlertTitle.displayName = "AlertTitle"
frontend/src/components/ui/alert.jsx:39:const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/alert.jsx:45:AlertDescription.displayName = "AlertDescription"
frontend/src/components/ui/alert.jsx:47:export { Alert, AlertTitle, AlertDescription }
frontend/src/components/ui/breadcrumb.jsx:8:  ({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />
frontend/src/components/ui/breadcrumb.jsx:47:    aria-disabled="true"
frontend/src/components/ui/breadcrumb.jsx:48:    aria-current="page"
frontend/src/components/ui/breadcrumb.jsx:61:    aria-hidden="true"
frontend/src/components/ui/breadcrumb.jsx:75:    aria-hidden="true"
frontend/src/components/ui/calendar.jsx:36:          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
frontend/src/components/ui/calendar.jsx:38:            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
frontend/src/components/ui/calendar.jsx:39:            : "[&:has([aria-selected])]:rounded-md"
frontend/src/components/ui/calendar.jsx:43:          "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
frontend/src/components/ui/calendar.jsx:51:          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
frontend/src/components/ui/calendar.jsx:54:          "aria-selected:bg-accent aria-selected:text-accent-foreground",
frontend/src/components/ui/carousel.jsx:14:    throw new Error("useCarousel must be used within a <Carousel />")
frontend/src/components/ui/carousel.jsx:106:        aria-roledescription="carousel"
frontend/src/components/ui/carousel.jsx:140:      aria-roledescription="slide"
frontend/src/components/ui/command.jsx:59:const CommandEmpty = React.forwardRef((props, ref) => (
frontend/src/components/ui/command.jsx:60:  <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />
frontend/src/components/ui/command.jsx:63:CommandEmpty.displayName = CommandPrimitive.Empty.displayName
frontend/src/components/ui/command.jsx:111:  CommandEmpty,
frontend/src/components/ui/form.jsx:32:    throw new Error("useFormField should be used within <FormField>")
frontend/src/components/ui/form.jsx:61:  const { error, formItemId } = useFormField()
frontend/src/components/ui/form.jsx:66:      className={cn(error && "text-destructive", className)}
frontend/src/components/ui/form.jsx:74:  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
frontend/src/components/ui/form.jsx:80:      aria-describedby={
frontend/src/components/ui/form.jsx:81:        !error
frontend/src/components/ui/form.jsx:85:      aria-invalid={!!error}
frontend/src/components/ui/form.jsx:105:  const { error, formMessageId } = useFormField()
frontend/src/components/ui/form.jsx:106:  const body = error ? String(error?.message ?? "") : children
frontend/src/components/ui/navigation-menu.jsx:47:      aria-hidden="true" />
frontend/src/components/ui/pagination.jsx:13:    aria-label="pagination"
frontend/src/components/ui/pagination.jsx:39:    aria-current={isActive ? "page" : undefined}
frontend/src/components/ui/pagination.jsx:53:    aria-label="Go to previous page"
frontend/src/components/ui/pagination.jsx:68:    aria-label="Go to next page"
frontend/src/components/ui/pagination.jsx:83:    aria-hidden
frontend/src/components/ui/skeleton.jsx:3:function Skeleton({
frontend/src/components/ui/skeleton.jsx:14:export { Skeleton }
frontend/src/components/ui/sonner.jsx:2:import { Toaster as Sonner, toast } from "sonner"
frontend/src/components/ui/sonner.jsx:4:const Toaster = ({
frontend/src/components/ui/sonner.jsx:12:      className="toaster group"
frontend/src/components/ui/sonner.jsx:13:      toastOptions={{
frontend/src/components/ui/sonner.jsx:15:          toast:
frontend/src/components/ui/sonner.jsx:16:            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
frontend/src/components/ui/sonner.jsx:17:          description: "group-[.toast]:text-muted-foreground",
frontend/src/components/ui/sonner.jsx:19:            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
frontend/src/components/ui/sonner.jsx:21:            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
frontend/src/components/ui/sonner.jsx:28:export { Toaster, toast }
frontend/src/components/ui/toast.jsx:2:import * as ToastPrimitives from "@radix-ui/react-toast"
frontend/src/components/ui/toast.jsx:8:const ToastProvider = ToastPrimitives.Provider
frontend/src/components/ui/toast.jsx:10:const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/toast.jsx:11:  <ToastPrimitives.Viewport
frontend/src/components/ui/toast.jsx:19:ToastViewport.displayName = ToastPrimitives.Viewport.displayName
frontend/src/components/ui/toast.jsx:21:const toastVariants = cva(
frontend/src/components/ui/toast.jsx:22:  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
frontend/src/components/ui/toast.jsx:37:const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
frontend/src/components/ui/toast.jsx:39:    <ToastPrimitives.Root
frontend/src/components/ui/toast.jsx:41:      className={cn(toastVariants({ variant }), className)}
frontend/src/components/ui/toast.jsx:45:Toast.displayName = ToastPrimitives.Root.displayName
frontend/src/components/ui/toast.jsx:47:const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/toast.jsx:48:  <ToastPrimitives.Action
frontend/src/components/ui/toast.jsx:56:ToastAction.displayName = ToastPrimitives.Action.displayName
frontend/src/components/ui/toast.jsx:58:const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/toast.jsx:59:  <ToastPrimitives.Close
frontend/src/components/ui/toast.jsx:65:    toast-close=""
frontend/src/components/ui/toast.jsx:68:  </ToastPrimitives.Close>
frontend/src/components/ui/toast.jsx:70:ToastClose.displayName = ToastPrimitives.Close.displayName
frontend/src/components/ui/toast.jsx:72:const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/toast.jsx:73:  <ToastPrimitives.Title
frontend/src/components/ui/toast.jsx:78:ToastTitle.displayName = ToastPrimitives.Title.displayName
frontend/src/components/ui/toast.jsx:80:const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
frontend/src/components/ui/toast.jsx:81:  <ToastPrimitives.Description ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
frontend/src/components/ui/toast.jsx:83:ToastDescription.displayName = ToastPrimitives.Description.displayName
frontend/src/components/ui/toast.jsx:85:export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction };
frontend/src/components/ui/toaster.jsx:1:import { useToast } from "@/hooks/use-toast"
frontend/src/components/ui/toaster.jsx:3:  Toast,
frontend/src/components/ui/toaster.jsx:4:  ToastClose,
frontend/src/components/ui/toaster.jsx:5:  ToastDescription,
frontend/src/components/ui/toaster.jsx:6:  ToastProvider,
frontend/src/components/ui/toaster.jsx:7:  ToastTitle,
frontend/src/components/ui/toaster.jsx:8:  ToastViewport,
frontend/src/components/ui/toaster.jsx:9:} from "@/components/ui/toast"
frontend/src/components/ui/toaster.jsx:11:export function Toaster() {
frontend/src/components/ui/toaster.jsx:12:  const { toasts } = useToast()
frontend/src/components/ui/toaster.jsx:15:    <ToastProvider>
frontend/src/components/ui/toaster.jsx:16:      {toasts.map(function ({ id, title, description, action, ...props }) {
frontend/src/components/ui/toaster.jsx:18:          <Toast key={id} {...props}>
frontend/src/components/ui/toaster.jsx:20:              {title && <ToastTitle>{title}</ToastTitle>}
frontend/src/components/ui/toaster.jsx:22:                <ToastDescription>{description}</ToastDescription>
frontend/src/components/ui/toaster.jsx:26:            <ToastClose />
frontend/src/components/ui/toaster.jsx:27:          </Toast>
frontend/src/components/ui/toaster.jsx:30:      <ToastViewport />
frontend/src/components/ui/toaster.jsx:31:    </ToastProvider>
frontend/src/components/Model3DViewer.js:14:        <button onClick={onClose} className="absolute top-4 end-4 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center z-10" aria-label={tr("إغلاق")}><X className="w-5 h-5" /></button>
frontend/src/components/Model3DViewer.js:15:        {!ready || failed ? <div className="text-center text-white font-arabic space-y-3"><Box className="w-10 h-10 mx-auto text-cyan-300" />{failed ? <p>{tr("تعذر تحميل عارض 3D لهذا الملف")}</p> : <p>{tr("جاري تحميل العارض...")}</p>}</div> : <div className="w-full max-w-5xl h-[80vh] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10"><model-viewer src={src} alt={tr("نموذج ثلاثي الأبعاد للإعلان")} camera-controls auto-rotate shadow-intensity="1" exposure="1" style={{ width: "100%", height: "100%" }} onError={() => setFailed(true)}><div slot="progress-bar" className="h-1 bg-cyan-400" /></model-viewer></div>}
frontend/src/components/VoiceCallModal.js:16:    const [error, setError] = useState("");
frontend/src/components/VoiceCallModal.js:37:        setError("");
frontend/src/components/VoiceCallModal.js:82:        setError("");
frontend/src/components/VoiceCallModal.js:91:            setError(tr("تعذر الوصول إلى الميكروفون أو بدء المكالمة"));
frontend/src/components/VoiceCallModal.js:135:                setError(tr("انتظر عرض المكالمة ثم حاول مرة أخرى"));
frontend/src/components/VoiceCallModal.js:144:            setError(tr("تعذر قبول المكالمة"));
frontend/src/components/VoiceCallModal.js:158:        <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
frontend/src/components/VoiceCallModal.js:164:                {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
frontend/src/components/VoiceCallModal.js:166:                    {status === "incoming" && <button onClick={acceptIncoming} className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center" aria-label={tr("قبول") }><Phone className="w-5 h-5" /></button>}
frontend/src/components/VoiceCallModal.js:167:                    {status !== "incoming" && status !== "failed" && <button onClick={toggleMute} className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] text-[var(--text)] flex items-center justify-center" aria-label={muted ? tr("تشغيل الميكروفون") : tr("كتم الميكروفون")}>{muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>}
frontend/src/components/VoiceCallModal.js:168:                    <button onClick={() => cleanup(true)} className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center" aria-label={tr("إنهاء المكالمة")}><PhoneOff className="w-5 h-5" /></button>
mobile/src/screens/AIAssistantScreen.js:3:import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
mobile/src/screens/AIAssistantScreen.js:113:            {messages.length === 0 ? <View style={styles.empty}>
mobile/src/screens/AIAssistantScreen.js:117:                    <Text style={styles.emptyTitle}>{t("اقتراحات سريعة:")}</Text>
mobile/src/screens/AIAssistantScreen.js:144:                                <ActivityIndicator size="small" color={colors.textMuted} />
mobile/src/screens/AIAssistantScreen.js:158:                    {busy ? <ActivityIndicator color="#fff" size="small" /> : <Send size={16} color="#fff" />}
mobile/src/screens/AIAssistantScreen.js:200:  empty: {
mobile/src/screens/AIAssistantScreen.js:205:  emptyTitle: {
mobile/src/screens/AuctionsScreen.js:3:import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Modal, TextInput, FlatList, Alert, Image, KeyboardAvoidingView, Platform } from "react-native";
mobile/src/screens/AuctionsScreen.js:24:  const [loading, setLoading] = useState(true);
mobile/src/screens/AuctionsScreen.js:25:  const [loadError, setLoadError] = useState("");
mobile/src/screens/AuctionsScreen.js:32:    setLoadError("");
mobile/src/screens/AuctionsScreen.js:42:    } catch (_) { setItems([]); setLoadError(t("تعذر تحميل المزادات. حاول مرة أخرى.")); } finally {
mobile/src/screens/AuctionsScreen.js:43:      setLoading(false);
mobile/src/screens/AuctionsScreen.js:106:            {loading ? <ActivityIndicator color={palette.primary} style={{
mobile/src/screens/AuctionsScreen.js:108:    }} /> : loadError ? <View style={styles.empty}><WifiOff size={40} color={palette.danger || colors.danger} /><Text style={styles.emptyText}>{loadError}</Text><TouchableOpacity onPress={load} style={styles.createBtn}><Text style={styles.createBtnText}>{t("إعادة المحاولة")}</Text></TouchableOpacity></View> : items.length === 0 ? <View style={styles.empty}>
mobile/src/screens/AuctionsScreen.js:110:                    <Text style={styles.emptyText}>{t("لا توجد مزادات نشطة الآن")}</Text>
mobile/src/screens/AuctionsScreen.js:232:      Alert.alert(t("تنبيه"), `${t("الحد الأدنى للمزايدة")}: ${minRequired.toLocaleString()} (${t("زيادة لا تقل عن")} ${minIncrement.toLocaleString()})`);
mobile/src/screens/AuctionsScreen.js:242:      Alert.alert(t("تنبيه"), e.response?.data?.detail || t("تعذر إيداع المزايدة"));
mobile/src/screens/AuctionsScreen.js:286:                            {busy ? <ActivityIndicator color="#fff" /> : <><Gavel size={14} color="#fff" /><Text style={styles.submitBtnText}>{t("أكد المزايدة")}</Text></>}
mobile/src/screens/AuctionsScreen.js:391:  empty: {
mobile/src/screens/AuctionsScreen.js:400:  emptyText: {
mobile/src/screens/AuthScreens.js:2:import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal } from "react-native";
mobile/src/screens/AuthScreens.js:7:import { formatApiError } from "../api";
mobile/src/screens/AuthScreens.js:85:        Alert.alert(t("خطأ"), e.message || `${t("حدث خطأ. حاول مرة أخرى.")} (${provider})`);
mobile/src/screens/AuthScreens.js:175:      // prompt (if available) is shown AFTER navigation via Alert.alert so
mobile/src/screens/AuthScreens.js:181:          Alert.alert(
mobile/src/screens/AuthScreens.js:188:                if (ok) Alert.alert("✅", `${t("تفعيل الدخول بـ")}${bioLabel}.`);
mobile/src/screens/AuthScreens.js:195:      setErr(formatApiError(e.response?.data?.detail) || t("حدث خطأ. حاول مرة أخرى."));
mobile/src/screens/AuthScreens.js:204:      Alert.alert("✅", `${t("تفعيل الدخول بـ")}${bioLabel}.`);
mobile/src/screens/AuthScreens.js:220:      setErr(formatApiError(e.response?.data?.detail) || t("حدث خطأ. حاول مرة أخرى."));
mobile/src/screens/AuthScreens.js:235:                    {err ? <View style={styles.errorBox}><Text style={styles.errorText}>{err}</Text></View> : null}
mobile/src/screens/AuthScreens.js:309:        setErr(v.error);
mobile/src/screens/AuthScreens.js:319:      setErr(formatApiError(e.response?.data?.detail) || t("حدث خطأ. حاول مرة أخرى."));
mobile/src/screens/AuthScreens.js:334:                    {err ? <View style={styles.errorBox}><Text style={styles.errorText}>{err}</Text></View> : null}
mobile/src/screens/AuthScreens.js:490:  errorBox: {
mobile/src/screens/AuthScreens.js:496:  errorText: {
mobile/src/screens/ChatScreen.js:6:import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StatusBar, StyleSheet, RefreshControl, Modal, Linking, PanResponder, Animated } from "react-native";
mobile/src/screens/ChatScreen.js:142:  const [loadingConvos, setLoadingConvos] = useState(true);
mobile/src/screens/ChatScreen.js:146:    if (!user) { setLoadingConvos(false); return; }
mobile/src/screens/ChatScreen.js:154:      setLoadingConvos(false);
mobile/src/screens/ChatScreen.js:247:  // "rendered fewer hooks than expected" red-screen error on logout.
mobile/src/screens/ChatScreen.js:277:            {loadingConvos ? <ActivityIndicator color={colors.primary} style={{
mobile/src/screens/ChatScreen.js:279:    }} /> : filtered.length === 0 ? <View style={s.empty}>
mobile/src/screens/ChatScreen.js:280:                    <View style={s.emptyIcon}><Send size={32} color={colors.primary} /></View>
mobile/src/screens/ChatScreen.js:281:                    <Text style={s.emptyTitle}>{search ? t("لا نتائج") : t("لا توجد محادثات بعد")}</Text>
mobile/src/screens/ChatScreen.js:282:                    <Text style={s.emptySub}>{t("تواصل مع البائعين من صفحة الإعلان")}</Text>
mobile/src/screens/ChatScreen.js:362:  const [loading, setLoading] = useState(true);
mobile/src/screens/ChatScreen.js:369:  const [uploading, setUploading] = useState(false);
mobile/src/screens/ChatScreen.js:391:  const queueForRetry = useCallback(async (item) => {
mobile/src/screens/ChatScreen.js:436:      setLoading(false);
mobile/src/screens/ChatScreen.js:565:    if (loading) return; // wait until history loaded so the dedupe check is meaningful
mobile/src/screens/ChatScreen.js:584:  }, [listing, loading, messages, user.id, other.id, t]);
mobile/src/screens/ChatScreen.js:607:    // success, mark failed on error. Owner mandate: sending must feel
mobile/src/screens/ChatScreen.js:638:      const retryItem = { client_message_id: tempId, receiver_id: other.id, listing_id: listing?.id || null, text, reply_to: optimistic.reply_to, created_at: optimistic.created_at };
mobile/src/screens/ChatScreen.js:639:      await queueForRetry(retryItem);
mobile/src/screens/ChatScreen.js:653:      setUploading(true);
mobile/src/screens/ChatScreen.js:689:      Alert.alert(t("خطأ"), t("تعذر إرسال الصورة"));
mobile/src/screens/ChatScreen.js:691:      setUploading(false);
mobile/src/screens/ChatScreen.js:701:        Alert.alert(t("إذن"), t("نحتاج صلاحية الموقع"));
mobile/src/screens/ChatScreen.js:715:      Alert.alert(t("خطأ"), t("تعذر إرسال الموقع"));
mobile/src/screens/ChatScreen.js:747:        setUploading(true);
mobile/src/screens/ChatScreen.js:783:        setUploading(false);
mobile/src/screens/ChatScreen.js:787:          Alert.alert(t("إذن"), t("نحتاج صلاحية الميكروفون"));
mobile/src/screens/ChatScreen.js:794:        if (!AudioRecorder) { Alert.alert(t("خطأ"), t("ميكروفون غير متاح")); return; }
mobile/src/screens/ChatScreen.js:805:      setUploading(false);
mobile/src/screens/ChatScreen.js:806:      Alert.alert(t("خطأ"), t("تعذر التسجيل"));
mobile/src/screens/ChatScreen.js:864:        Alert.alert(t("خيارات"), `${other.name || t("المستخدم")}`, [{
mobile/src/screens/ChatScreen.js:873:              Alert.alert("✅", t("تم استلام بلاغك"));
mobile/src/screens/ChatScreen.js:875:              Alert.alert(t("خطأ"), t("تعذر إرسال البلاغ"));
mobile/src/screens/ChatScreen.js:884:              Alert.alert("🚫", t("تم حظر المستخدم"));
mobile/src/screens/ChatScreen.js:887:              Alert.alert(t("خطأ"), t("تعذر الحظر"));
mobile/src/screens/ChatScreen.js:915:            {loading ? <View style={{
mobile/src/screens/ChatScreen.js:918:    }}><ActivityIndicator color={colors.primary} /></View> : <View style={{ flex: 1 }}>
mobile/src/screens/ChatScreen.js:1005:                        {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Mic size={20} color="#fff" />}
mobile/src/screens/ChatScreen.js:1074:    const [loading, setLoading] = useState(true);
mobile/src/screens/ChatScreen.js:1081:            } catch (_) {} finally { setLoading(false); }
mobile/src/screens/ChatScreen.js:1095:            Alert.alert("✓", t("تمت إعادة التوجيه"));
mobile/src/screens/ChatScreen.js:1097:            Alert.alert(t("خطأ"), t("تعذرت إعادة التوجيه"));
mobile/src/screens/ChatScreen.js:1104:                {loading ? <ActivityIndicator color={colors.primary} style={{ padding: 20 }} /> :
mobile/src/screens/ChatScreen.js:1105:                  list.length === 0 ? <Text style={s.fwdEmpty}>{t("لا توجد محادثات")}</Text> :
mobile/src/screens/ChatScreen.js:1296:      Alert.alert(t("خطأ"), t("تعذر تشغيل الصوت"));
mobile/src/screens/ChatScreen.js:1543:  empty: {
mobile/src/screens/ChatScreen.js:1548:  emptyIcon: {
mobile/src/screens/ChatScreen.js:1556:  emptyTitle: {
mobile/src/screens/ChatScreen.js:1561:  emptySub: {
mobile/src/screens/ChatScreen.js:1825:  fwdEmpty: {
mobile/src/screens/FlightsScreen.js:3:import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, FlatList, Linking, Alert, Platform } from "react-native";
mobile/src/screens/FlightsScreen.js:403:      Alert.alert(t("تنبيه"), t("الرجاء اختيار المطار والتاريخ"));
mobile/src/screens/FlightsScreen.js:407:      Alert.alert(t("تنبيه"), t("لا يمكن أن يكون المغادرة والوصول متشابهين"));
mobile/src/screens/HomeScreen.js:3:import { View, Text, ScrollView, TouchableOpacity, FlatList, Image, StyleSheet, RefreshControl, ActivityIndicator, Dimensions, StatusBar } from "react-native";
mobile/src/screens/HomeScreen.js:8:import { Modal, Alert } from "react-native";
mobile/src/screens/HomeScreen.js:20:import { SkeletonListingGrid } from "../components/Skeleton";
mobile/src/screens/HomeScreen.js:41:  const [loading, setLoading] = useState(true);
mobile/src/screens/HomeScreen.js:46:  const [loadingMore, setLoadingMore] = useState(false);
mobile/src/screens/HomeScreen.js:53:    } else setLoading(true);
mobile/src/screens/HomeScreen.js:70:      setLoading(false);
mobile/src/screens/HomeScreen.js:78:    if (loadingMore || !hasMore || inflightRef.current) return;
mobile/src/screens/HomeScreen.js:80:    setLoadingMore(true);
mobile/src/screens/HomeScreen.js:97:      setLoadingMore(false);
mobile/src/screens/HomeScreen.js:100:  }, [page, hasMore, loadingMore]);
mobile/src/screens/HomeScreen.js:133:    }} ListHeaderComponent={Header} renderItem={renderItem} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={7} removeClippedSubviews ListEmptyComponent={loading ? <SkeletonListingGrid count={8} /> : <View style={styles.empty}>
mobile/src/screens/HomeScreen.js:135:                    </View>} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={colors.primary} />} onEndReached={loadMore} onEndReachedThreshold={0.6} ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{
mobile/src/screens/HomeScreen.js:166:      Alert.alert(
mobile/src/screens/HomeScreen.js:174:              if (!perm.granted) { Alert.alert(t("تنبيه"), t("يلزم إذن الكاميرا")); return; }
mobile/src/screens/HomeScreen.js:203:      if (!b64) { Alert.alert(t("خطأ"), t("تعذر قراءة الصورة")); return; }
mobile/src/screens/HomeScreen.js:208:        if (!q) { Alert.alert(t("تنبيه"), t("لم نتمكن من فهم الصورة. حاول بصورة أوضح.")); return; }
mobile/src/screens/HomeScreen.js:211:        Alert.alert(t("خطأ"), t("خطأ في البحث بالصورة"));
mobile/src/screens/HomeScreen.js:252:                  accessibilityLabel={t("بحث بالصورة")}
mobile/src/screens/HomeScreen.js:256:                    ? <ActivityIndicator size="small" color={colors.primaryHover} />
mobile/src/screens/HomeScreen.js:733:  // Empty/loading
mobile/src/screens/HomeScreen.js:734:  empty: {
mobile/src/screens/ListingDetailScreen.js:2:import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert, Share, FlatList, Dimensions, Modal, TextInput, PanResponder } from "react-native";
mobile/src/screens/ListingDetailScreen.js:51:  const [priceAlertOpen, setPriceAlertOpen] = useState(false);
mobile/src/screens/ListingDetailScreen.js:52:  const [priceAlertVal, setPriceAlertVal] = useState("");
mobile/src/screens/ListingDetailScreen.js:78:        Alert.alert(t("خطأ"), t("تعذر تحميل الإعلان"));
mobile/src/screens/ListingDetailScreen.js:171:    } catch (e) { Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر نشر التعليق")); }
mobile/src/screens/ListingDetailScreen.js:181:      Alert.alert(t("تم"), t("تم استلام بلاغك"));
mobile/src/screens/ListingDetailScreen.js:183:      Alert.alert(t("خطأ"), t("تعذر إرسال البلاغ"));
mobile/src/screens/ListingDetailScreen.js:191:      Alert.alert(t("تم"), data.message || t("تم التجديد"));
mobile/src/screens/ListingDetailScreen.js:193:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التجديد"));
mobile/src/screens/ListingDetailScreen.js:197:    Alert.alert(t("تأكيد"), t("هل تم بيع المنتج؟"), [{
mobile/src/screens/ListingDetailScreen.js:205:          Alert.alert(t("تم"), t("شكراً لك! نتمنى لك بيعاً موفقاً دائماً"));
mobile/src/screens/ListingDetailScreen.js:208:          Alert.alert(t("خطأ"), t("تعذر التحديث"));
mobile/src/screens/ListingDetailScreen.js:222:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التحديث"));
mobile/src/screens/ListingDetailScreen.js:238:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التحديث"));
mobile/src/screens/ListingDetailScreen.js:242:    const target = parseFloat(priceAlertVal);
mobile/src/screens/ListingDetailScreen.js:244:      Alert.alert(t("خطأ"), t("أدخل سعراً صحيحاً"));
mobile/src/screens/ListingDetailScreen.js:253:      setPriceAlertOpen(false);
mobile/src/screens/ListingDetailScreen.js:254:      setPriceAlertVal("");
mobile/src/screens/ListingDetailScreen.js:255:      Alert.alert(t("تم"), t("تم تفعيل التنبيه"));
mobile/src/screens/ListingDetailScreen.js:257:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التفعيل"));
mobile/src/screens/ListingDetailScreen.js:264:      Alert.alert(t("تم"), t("تم إلغاء التنبيه"));
mobile/src/screens/ListingDetailScreen.js:269:      Alert.alert(t("غير متاح"), t("لا توجد إحداثيات لهذا الإعلان"));
mobile/src/screens/ListingDetailScreen.js:363:        Alert.alert(t("تأكيد الحذف"), t("هل تريد حذف هذا الإعلان نهائياً؟"), [{
mobile/src/screens/ListingDetailScreen.js:372:              Alert.alert("تم الحذف");
mobile/src/screens/ListingDetailScreen.js:375:              Alert.alert(t("خطأ"), t("تعذر الحذف"));
mobile/src/screens/ListingDetailScreen.js:422:                {comments.length === 0 ? <Text style={styles.emptyComments}>{t("لا توجد تعليقات بعد")}</Text> : comments.map(comment => <View key={comment.id} style={styles.commentCard}><View style={styles.commentMeta}><Text style={styles.commentAuthor}>{comment.author?.name || t("مستخدم")}</Text>{comment.author?.verified && <CheckCircle2 size={13} color={theme.colors.primary} />}<Text style={styles.commentDate}>{new Date(comment.created_at).toLocaleDateString()}</Text></View><Text style={styles.commentBody}>{comment.text}</Text></View>)}
mobile/src/screens/ListingDetailScreen.js:495:        setPriceAlertVal(String(Math.round((listing.price || 0) * 0.9)));
mobile/src/screens/ListingDetailScreen.js:496:        setPriceAlertOpen(true);
mobile/src/screens/ListingDetailScreen.js:497:      }} style={[styles.priceAlertBtn, watching && styles.priceAlertBtnActive]} testID="mobile-price-alert">
mobile/src/screens/ListingDetailScreen.js:499:                        <Text style={[styles.priceAlertText, watching && {
mobile/src/screens/ListingDetailScreen.js:511:        Alert.alert(t("الإبلاغ عن الإعلان"), t("اختر سبب الإبلاغ"), [{
mobile/src/screens/ListingDetailScreen.js:804:  emptyComments: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 14, textAlign: "right" },
mobile/src/screens/ListingDetailScreen.js:949:  priceAlertBtn: {
mobile/src/screens/ListingDetailScreen.js:961:  priceAlertText: {
mobile/src/screens/ListingDetailScreen.js:1045:  priceAlertBtnActive: {
mobile/src/screens/MapScreen.js:2:import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, TextInput } from "react-native";
mobile/src/screens/MapScreen.js:20:  const [loading, setLoading] = useState(true);
mobile/src/screens/MapScreen.js:35:        // Don't crash — render an empty map with the search bar instead.
mobile/src/screens/MapScreen.js:39:        setLoading(false);
mobile/src/screens/MapScreen.js:69:  if (loading) {
mobile/src/screens/MapScreen.js:71:                <ActivityIndicator size="large" color={theme.colors.primary} />
mobile/src/screens/MapScreen.js:72:                <Text style={styles.loadingText}>{t("جاري تحميل الخريطة...")}</Text>
mobile/src/screens/MapScreen.js:253:  loadingText: {
mobile/src/screens/MoreScreens.js:6:import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from "react-native";
mobile/src/screens/MoreScreens.js:14:import { SkeletonListingGrid, SkeletonCategoryGrid } from "../components/Skeleton";
mobile/src/screens/MoreScreens.js:32:  const [loading, setLoading] = useState(true);
mobile/src/screens/MoreScreens.js:35:    setLoading(true);
mobile/src/screens/MoreScreens.js:47:      if (alive) setLoading(false);
mobile/src/screens/MoreScreens.js:53:  if (loading) return <SkeletonCategoryGrid count={10} />;
mobile/src/screens/MoreScreens.js:83:  const [loading, setLoading] = useState(true);
mobile/src/screens/MoreScreens.js:87:      setLoading(false);
mobile/src/screens/MoreScreens.js:91:    setLoading(true);
mobile/src/screens/MoreScreens.js:104:      if (alive) setLoading(false);
mobile/src/screens/MoreScreens.js:122:            {loading ? <View style={s.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View> : <FlatList data={items} keyExtractor={item => String(item?.id)} numColumns={2} contentContainerStyle={{
mobile/src/screens/MoreScreens.js:125:    }} renderItem={renderListing} ListEmptyComponent={<View style={{
mobile/src/screens/MoreScreens.js:140:  const [loading, setLoading] = useState(true);
mobile/src/screens/MoreScreens.js:142:    if (!user) { setLoading(false); return; }
mobile/src/screens/MoreScreens.js:145:    }) => setItems(data?.items || data || [])).catch(() => setItems([])).finally(() => setLoading(false));
mobile/src/screens/MoreScreens.js:209:  if (loading) return <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>;
mobile/src/screens/MoreScreens.js:230:              ListEmptyComponent={<View style={{ padding: 60, alignItems: "center" }}>
mobile/src/screens/MoreScreens.js:367:  const [loading, setLoading] = useState(true);
mobile/src/screens/MoreScreens.js:380:      if (mounted) setLoading(false);
mobile/src/screens/MoreScreens.js:386:  if (loading) return <View style={{
mobile/src/screens/MoreScreens.js:389:  }}><ActivityIndicator color={theme.colors.primary} /></View>;
mobile/src/screens/MoreScreens.js:596:  const [loading, setLoading] = useState(true);
mobile/src/screens/MoreScreens.js:598:    setLoading(true);
mobile/src/screens/MoreScreens.js:601:    }) => setItems(data || [])).finally(() => setLoading(false));
mobile/src/screens/MoreScreens.js:612:  if (loading) return <View style={{
mobile/src/screens/MoreScreens.js:615:  }}><ActivityIndicator color={theme.colors.primary} /></View>;
mobile/src/screens/MoreScreens.js:645:                    </View>} ListEmptyComponent={<View style={{
mobile/src/screens/MoreScreens.js:664:  const [loading, setLoading] = useState(true);
mobile/src/screens/MoreScreens.js:687:    }).finally(() => setLoading(false));
mobile/src/screens/MoreScreens.js:689:  if (loading) return <View style={{
mobile/src/screens/MoreScreens.js:692:  }}><ActivityIndicator color={theme.colors.primary} /></View>;
mobile/src/screens/MoreScreens.js:790:  }}><ActivityIndicator color={theme.colors.primary} /></View>;
mobile/src/screens/OtherScreens.js:2:import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
mobile/src/screens/OtherScreens.js:20:function LoadingBlock() {
mobile/src/screens/OtherScreens.js:21:  return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
mobile/src/screens/OtherScreens.js:23:function EmptyBlock({
mobile/src/screens/OtherScreens.js:26:  return <View style={styles.empty}><Text style={styles.emptyText}>{text}</Text></View>;
mobile/src/screens/OtherScreens.js:39:  const [loading, setLoading] = useState(true);
mobile/src/screens/OtherScreens.js:42:    if (showSpinner) setLoading(true);
mobile/src/screens/OtherScreens.js:51:      setLoading(false);
mobile/src/screens/OtherScreens.js:67:            {loading ? <LoadingBlock /> : <FlatList data={items} numColumns={2} keyExtractor={keyExtractor} renderItem={renderItem} contentContainerStyle={{
mobile/src/screens/OtherScreens.js:70:    }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} ListEmptyComponent={<EmptyBlock text={t("لا توجد إعلانات في المفضلة")} />} {...FLAT_PERF} />}
mobile/src/screens/OtherScreens.js:82:  const [loading, setLoading] = useState(true);
mobile/src/screens/OtherScreens.js:85:    if (showSpinner) setLoading(true);
mobile/src/screens/OtherScreens.js:94:      setLoading(false);
mobile/src/screens/OtherScreens.js:134:            {loading ? <LoadingBlock /> : <FlatList data={items} numColumns={2} keyExtractor={keyExtractor} renderItem={renderItem} contentContainerStyle={{
mobile/src/screens/OtherScreens.js:137:    }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} ListEmptyComponent={<EmptyBlock text={t("لا توجد إعلانات بعد")} />} {...FLAT_PERF} />}
mobile/src/screens/OtherScreens.js:150:  const [loading, setLoading] = useState(true);
mobile/src/screens/OtherScreens.js:153:    setLoading(true);
mobile/src/screens/OtherScreens.js:165:      if (alive) setLoading(false);
mobile/src/screens/OtherScreens.js:192:            {loading ? <LoadingBlock /> : <FlatList data={items} numColumns={2} keyExtractor={keyExtractor} renderItem={renderItem} contentContainerStyle={{
mobile/src/screens/OtherScreens.js:195:    }} ListEmptyComponent={<EmptyBlock text={t("لا توجد صفقات بارزة الآن")} />} {...FLAT_PERF} />}
mobile/src/screens/OtherScreens.js:233:  empty: {
mobile/src/screens/OtherScreens.js:237:  emptyText: {
mobile/src/screens/PasswordReset.js:2:import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
mobile/src/screens/PasswordReset.js:3:import api, { formatApiError } from "../api";
mobile/src/screens/PasswordReset.js:27:        Alert.alert(t("رمز التحقق"), data.dev_reset_link);
mobile/src/screens/PasswordReset.js:30:      setErr(formatApiError(e.response?.data?.detail) || t("حدث خطأ. حاول مرة أخرى."));
mobile/src/screens/PasswordReset.js:79:      Alert.alert("تم تغيير كلمة المرور بنجاح");
mobile/src/screens/PasswordReset.js:82:      setErr(formatApiError(e.response?.data?.detail) || t("حدث خطأ. حاول مرة أخرى."));
mobile/src/screens/PostScreen.js:5:import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, Modal, FlatList, KeyboardAvoidingView, Platform } from "react-native";
mobile/src/screens/PostScreen.js:14:import api, { formatApiError } from "../api";
mobile/src/screens/PostScreen.js:43:  const [uploadingImg, setUploadingImg] = useState(false);
mobile/src/screens/PostScreen.js:44:  const [uploadingModel, setUploadingModel] = useState(false);
mobile/src/screens/PostScreen.js:45:  const [uploadingVid, setUploadingVid] = useState(false);
mobile/src/screens/PostScreen.js:123:    Alert.alert(
mobile/src/screens/PostScreen.js:141:        Alert.alert(t("إذن الكاميرا"), t("الرجاء السماح بالوصول للكاميرا من الإعدادات"));
mobile/src/screens/PostScreen.js:156:      Alert.alert(t("إذن"), t("نحتاج صلاحية الصور"));
mobile/src/screens/PostScreen.js:180:        Alert.alert(t("لم يتمكن المساعد من قراءة الصورة"), t("جرّب صورة أوضح للمنتج"));
mobile/src/screens/PostScreen.js:200:      Alert.alert(t("تم بالذكاء الاصطناعي"), filledMsg || t("تم"));
mobile/src/screens/PostScreen.js:202:      Alert.alert(t("خطأ"), formatApiError(e.response?.data?.detail) || t("تعذر التعبئة"));
mobile/src/screens/PostScreen.js:208:    setUploadingImg(true);
mobile/src/screens/PostScreen.js:242:      Alert.alert(t("خطأ"), t("فشل رفع الصورة"));
mobile/src/screens/PostScreen.js:244:      setUploadingImg(false);
mobile/src/screens/PostScreen.js:250:      Alert.alert(t("إذن"), t("نحتاج صلاحية الصور"));
mobile/src/screens/PostScreen.js:263:      Alert.alert(t("إذن"), t("نحتاج صلاحية الكاميرا"));
mobile/src/screens/PostScreen.js:268:    Alert.alert(t("الكاميرا"), t("ماذا تريد التقاطه؟"), [
mobile/src/screens/PostScreen.js:297:    if (asset.size && asset.size > 80 * 1024 * 1024) { Alert.alert(t("خطأ"), t("ملف 3D أكبر من 80 ميجابايت")); return; }
mobile/src/screens/PostScreen.js:298:    setUploadingModel(true);
mobile/src/screens/PostScreen.js:306:      if (!out.secure_url) throw new Error("upload_failed");
mobile/src/screens/PostScreen.js:308:    } catch (_) { Alert.alert(t("خطأ"), t("فشل رفع نموذج 3D")); }
mobile/src/screens/PostScreen.js:309:    finally { setUploadingModel(false); }
mobile/src/screens/PostScreen.js:314:      Alert.alert(t("إذن"), t("نحتاج صلاحية الوسائط"));
mobile/src/screens/PostScreen.js:328:    setUploadingVid(true);
mobile/src/screens/PostScreen.js:360:        Alert.alert(t("خطأ"), t("فشل رفع الفيديو"));
mobile/src/screens/PostScreen.js:363:      Alert.alert(t("خطأ"), t("فشل رفع الفيديو"));
mobile/src/screens/PostScreen.js:365:      setUploadingVid(false);
mobile/src/screens/PostScreen.js:375:      Alert.alert(t("إذن"), t("نحتاج صلاحية الموقع"));
mobile/src/screens/PostScreen.js:396:        Alert.alert("✅", `${t("تم اقتراح:")} ${leaf?.name || ""}\n${t("يمكنك تغييرها يدوياً.")}`);
mobile/src/screens/PostScreen.js:404:          Alert.alert("⚠️", t("موقعك خارج المنطقة المدعومة. اختر المدينة يدوياً."));
mobile/src/screens/PostScreen.js:407:          Alert.alert("✅", `${t("تم اقتراح:")} ${data.city}${data.district ? " — " + data.district : ""}\n${t("يمكنك تغييرها يدوياً.")}`);
mobile/src/screens/PostScreen.js:410:          Alert.alert("✅", t("تم تحديد موقعك. اختر المدينة يدوياً."));
mobile/src/screens/PostScreen.js:414:        Alert.alert("✅", t("تم تحديد موقعك"));
mobile/src/screens/PostScreen.js:417:      Alert.alert(t("خطأ"), t("تعذّر الوصول للموقع"));
mobile/src/screens/PostScreen.js:424:  // false-positive "حقل مطلوب: الماركة" errors. The cascade components are
mobile/src/screens/PostScreen.js:503:      setErr(formatApiError(e.response?.data?.detail) || t("تعذر النشر"));
mobile/src/screens/PostScreen.js:579:      }} /> : <Step2 form={form} setForm={setForm} cat={cat} categories={categories} onPickerOpen={setPickerOpen} country={country} user={user} onPickImage={pickImage} onTakePhoto={takePhoto} uploadingImg={uploadingImg} onPickVideo={pickVideo} onRemoveVideo={removeVideo} uploadingVid={uploadingVid} uploadingModel={uploadingModel} onPickModel3D={pickModel3D} onUseLocation={useMyLocation} />}
mobile/src/screens/PostScreen.js:597:                        {busy ? <ActivityIndicator color="#fff" /> : <>
mobile/src/screens/PostScreen.js:645:  const [loading, setLoading] = useState(false);
mobile/src/screens/PostScreen.js:654:    setLoading(true);
mobile/src/screens/PostScreen.js:665:      }) => setRemote(data || [])).catch(() => setRemote([])).finally(() => setLoading(false));
mobile/src/screens/PostScreen.js:676:      }) => setRemote(data || [])).catch(() => setRemote([])).finally(() => setLoading(false));
mobile/src/screens/PostScreen.js:678:      setLoading(false);
mobile/src/screens/PostScreen.js:686:      setLoading(true);
mobile/src/screens/PostScreen.js:710:        setLoading(false);
mobile/src/screens/PostScreen.js:742:                        {loading && <ActivityIndicator size="small" color={colors.primary} />}
mobile/src/screens/PostScreen.js:744:                    {items.length === 0 && !loading && <Text style={{
mobile/src/screens/PostScreen.js:816:                {aiBusy && <ActivityIndicator color="#fff" />}
mobile/src/screens/PostScreen.js:895:  uploadingImg,
mobile/src/screens/PostScreen.js:898:  uploadingVid,
mobile/src/screens/PostScreen.js:899:  uploadingModel,
mobile/src/screens/PostScreen.js:1237:                        {uploadingVid && <ActivityIndicator color={colors.primary} style={{
mobile/src/screens/PostScreen.js:1248:                {uploadingModel && <ActivityIndicator color="#7C3AED" style={{ marginTop: 8 }} />}
mobile/src/screens/PostScreen.js:1267:                {uploadingImg && <ActivityIndicator color={colors.primary} style={{
mobile/src/screens/PostScreen.js:1388:  const [loading, setLoading] = useState(false);
mobile/src/screens/PostScreen.js:1404:      setLoading(true);
mobile/src/screens/PostScreen.js:1417:        if (!cancelled) setLoading(false);
mobile/src/screens/PostScreen.js:1424:  if (loading) {
mobile/src/screens/PostScreen.js:1425:    return <View style={s.mpRow}><ActivityIndicator size="small" color={colors.primary} /><Text style={s.mpHint}>{t("جاري حساب متوسط السوق...")}</Text></View>;
mobile/src/screens/ProfileScreen.js:5:import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, StatusBar, Alert, Share } from "react-native";
mobile/src/screens/ProfileScreen.js:101:      Alert.alert("✅", next ? t("أصبح رقم جوالك مرئياً للمشترين") : t("تم إخفاء رقم جوالك"));
mobile/src/screens/ProfileScreen.js:103:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التحديث"));
mobile/src/screens/ProfileScreen.js:109:    Alert.alert(t("تأكيد"), t("هل تريد تسجيل الخروج؟"), [{
mobile/src/screens/ProfileScreen.js:244:                    {phoneBusy ? <ActivityIndicator size="small" color={colors.primary} /> : <ChevronLeft size={14} color={colors.textMuted} />}
mobile/src/screens/ReelsScreen.js:2:import { View, Text, FlatList, StyleSheet, Dimensions, Image, TouchableOpacity, ActivityIndicator, Share, Alert, StatusBar, PanResponder } from "react-native";
mobile/src/screens/ReelsScreen.js:28:  const [loading, setLoading] = useState(true);
mobile/src/screens/ReelsScreen.js:92:      setLoading(false);
mobile/src/screens/ReelsScreen.js:107:  // (loading / empty state) otherwise hook count changes between renders.
mobile/src/screens/ReelsScreen.js:119:  if (loading) {
mobile/src/screens/ReelsScreen.js:120:    return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
mobile/src/screens/ReelsScreen.js:125:                <Text style={styles.emptyText}>{t("لا توجد قصص بعد")}</Text>
mobile/src/screens/ReelsScreen.js:126:                <TouchableOpacity onPress={() => nav.navigate("Post")} style={styles.postCta} testID="reels-empty-post-btn">
mobile/src/screens/ReelsScreen.js:140:              accessibilityLabel={t("خروج")}
mobile/src/screens/ReelsScreen.js:360:  emptyIcon: {
mobile/src/screens/ReelsScreen.js:363:  emptyText: {
mobile/src/screens/SearchScreen.js:4:import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal, StatusBar, Dimensions, RefreshControl, Alert } from "react-native";
mobile/src/screens/SearchScreen.js:64:  const [loading, setLoading] = useState(false);
mobile/src/screens/SearchScreen.js:122:        if (!AudioRecorder) { Alert.alert(t("خطأ"), t("ميكروفون غير متاح")); return; }
mobile/src/screens/SearchScreen.js:143:        Alert.alert(t("خطأ"), t("تعذر قراءة الصورة"));
mobile/src/screens/SearchScreen.js:150:      if (!query) throw new Error("empty image query");
mobile/src/screens/SearchScreen.js:154:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر تحليل الصورة؛ حاول مرة أخرى"));
mobile/src/screens/SearchScreen.js:212:    setLoading(true);
mobile/src/screens/SearchScreen.js:240:      setLoading(false);
mobile/src/screens/SearchScreen.js:286:      Alert.alert(t("تنبيه"), t("اكتب عبارة بحث أولاً"));
mobile/src/screens/SearchScreen.js:297:      Alert.alert("✅", t("تم حفظ البحث. سننبهك عند ظهور نتائج جديدة."));
mobile/src/screens/SearchScreen.js:299:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر الحفظ"));
mobile/src/screens/SearchScreen.js:325:                            {voiceBusy ? <ActivityIndicator size="small" color={colors.primary} /> : <Mic size={16} color={voiceRec ? "#EF4444" : colors.primary} />}
mobile/src/screens/SearchScreen.js:328:                        {imageBusy ? <ActivityIndicator size="small" color={colors.primary} /> : <Camera size={16} color={colors.primary} />}
mobile/src/screens/SearchScreen.js:337:            {(voiceBusy || imageBusy) && <View style={s.aiSearchStatus}><ActivityIndicator size="small" color={colors.primary} /><Text style={s.aiSearchStatusText}>{imageBusy ? t("جارٍ رفع الصورة وتحليلها...") : voiceRec ? t("جارٍ الاستماع...") : t("جارٍ تحويل الصوت إلى نص...")}</Text></View>}
mobile/src/screens/SearchScreen.js:380:            {loading ? <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View> : results.length === 0 && q ? <View style={s.empty}>
mobile/src/screens/SearchScreen.js:384:                    <Text style={s.emptyTitle}>{t("لا توجد نتائج")}</Text>
mobile/src/screens/SearchScreen.js:385:                    <Text style={s.emptySub}>{t("جرّب كلمات أخرى أو غيّر الفلاتر")}</Text>
mobile/src/screens/SearchScreen.js:737:  empty: {
mobile/src/screens/SearchScreen.js:744:  emptyTitle: {
mobile/src/screens/SearchScreen.js:749:  emptySub: {
mobile/src/screens/SellerProfile.js:6:import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Modal } from "react-native";
mobile/src/screens/SellerProfile.js:30:  const [loading, setLoading] = useState(true);
mobile/src/screens/SellerProfile.js:59:        setLoading(false);
mobile/src/screens/SellerProfile.js:74:      Alert.alert(t("خطأ"), t("حدث خطأ. حاول مرة أخرى."));
mobile/src/screens/SellerProfile.js:83:      Alert.alert("✅", t("شكراً لك!"));
mobile/src/screens/SellerProfile.js:94:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("حدث خطأ. حاول مرة أخرى."));
mobile/src/screens/SellerProfile.js:97:  if (loading) return <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>;
mobile/src/screens/SellerProfile.js:132:          Alert.alert(t("خيارات"), "", [{
mobile/src/screens/SellerProfile.js:141:                Alert.alert("✅", t("تم استلام بلاغك"));
mobile/src/screens/SellerProfile.js:150:                Alert.alert("🚫", t("تم الحظر"));
mobile/src/screens/SellerProfile.js:173:                    </View>} ListEmptyComponent={<Text style={s.muted}>{t("لا توجد بيانات")}</Text>} />
mobile/src/screens/WalletScreen.js:3:import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Alert } from "react-native";
mobile/src/screens/WalletScreen.js:30:  const [loading, setLoading] = useState(true);
mobile/src/screens/WalletScreen.js:35:      setLoading(false);
mobile/src/screens/WalletScreen.js:44:      setLoading(false);
mobile/src/screens/WalletScreen.js:57:      Alert.alert(t("تم!"), `تم استلام مكافأتك ${r.amount} ر.س 🎉`);
mobile/src/screens/WalletScreen.js:65:      Alert.alert(t("تنبيه"), typeof msg === "string" ? msg : t("تعذر استلام المكافأة"));
mobile/src/screens/WalletScreen.js:126:                        {claiming ? <ActivityIndicator color={colors.secondary} size="small" /> : <Sparkles size={14} color={colors.secondary} />}
mobile/src/screens/WalletScreen.js:159:                {loading ? <ActivityIndicator color={colors.primary} style={{
mobile/src/screens/WalletScreen.js:161:      }} /> : (data.transactions || []).length === 0 ? <Text style={styles.emptyText}>{t("لا توجد عمليات بعد")}</Text> : data.transactions.map((tx, i) => {
mobile/src/screens/WalletScreen.js:312:  emptyText: {
mobile/src/screens/OffersScreen.js:3:import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal, Alert } from "react-native";
mobile/src/screens/OffersScreen.js:17:  const [loading, setLoading] = useState(true);
mobile/src/screens/OffersScreen.js:24:    setLoading(true);
mobile/src/screens/OffersScreen.js:25:    try { const { data } = await api.get("/offers/mine"); setOffers(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])); } catch (_) { setOffers([]); } finally { setLoading(false); }
mobile/src/screens/OffersScreen.js:32:    catch (e) { Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر تحديث العرض")); }
mobile/src/screens/OffersScreen.js:41:    {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : offers.length === 0 ? <View style={s.empty}><Tag size={34} color={palette.textMuted} /><Text style={[s.emptyText, { color: palette.textMuted }]}>{t("لا توجد عروض بعد")}</Text></View> : offers.map((offer) => {
mobile/src/screens/OffersScreen.js:57:const s = StyleSheet.create({ wrap: { flex: 1 }, content: { padding: 18, paddingBottom: 100 }, center: { flex: 1, justifyContent: "center", alignItems: "center" }, title: { fontSize: 24, fontWeight: "900", marginBottom: 5 }, sub: { fontSize: 13, marginBottom: 18 }, card: { borderWidth: 1, borderRadius: 18, padding: 13, marginBottom: 10 }, cardTop: { flexDirection: "row", alignItems: "center", gap: 10 }, icon: { width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(59,130,246,.12)", alignItems: "center", justifyContent: "center" }, listingTitle: { fontSize: 14, fontWeight: "800" }, meta: { fontSize: 11, marginTop: 4 }, badge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9 }, badgeText: { fontSize: 10, fontWeight: "800", color: "#374151" }, expiry: { fontSize: 11, marginTop: 9, flexDirection: "row", alignItems: "center", gap: 4 }, actions: { flexDirection: "row", gap: 7, marginTop: 12 }, action: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 4 }, actionText: { color: "#fff", fontSize: 11, fontWeight: "800" }, empty: { alignItems: "center", padding: 60, gap: 10 }, emptyText: { fontSize: 14 }, modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,.55)", alignItems: "center", justifyContent: "center", padding: 20 }, modal: { width: "100%", maxWidth: 420, borderRadius: 20, padding: 18 }, modalTitle: { fontSize: 18, fontWeight: "900", marginBottom: 12 }, input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 }, modalActions: { flexDirection: "row", gap: 8, marginTop: 14 }, modalBtn: { flex: 1, alignItems: "center", padding: 12, borderRadius: 12 }
mobile/src/screens/WorkflowScreens.js:2:import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
mobile/src/screens/WorkflowScreens.js:19:  const [loading, setLoading] = useState(true);
mobile/src/screens/WorkflowScreens.js:24:  const load = useCallback(async () => { setLoading(true); try { const { data } = await api.get(buy ? "/buy-requests/mine" : "/support/tickets", { params: { country_code: country } }); setRows(Array.isArray(data) ? data : []); } catch (_) { setRows([]); } finally { setLoading(false); } }, [buy, country]);
mobile/src/screens/WorkflowScreens.js:27:  return <SafeAreaView style={[s.root, { backgroundColor: palette.bg }]}><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><FlatList data={rows} keyExtractor={(x) => String(x.id)} refreshing={loading} onRefresh={load} contentContainerStyle={s.content} ListHeaderComponent={<View><Text style={[s.title, { color: palette.text }]}>{t(buy ? "طلبات الشراء" : "الدعم والمساعدة")}</Text><Text style={[s.caption, { color: palette.muted }]}>{t(buy ? "اطلب منتجًا أو خدمة في الدولة المختارة" : "أنشئ تذكرة وتابع حالتها")}</Text>{buy ? <><Field value={form.title} onChangeText={(v) => set("title", v)} placeholder={t("عنوان الطلب")} /><Field value={form.category} onChangeText={(v) => set("category", v)} placeholder={t("الفئة")} /><Field value={form.city} onChangeText={(v) => set("city", v)} placeholder={t("المدينة")} /><View style={s.row}><Field value={form.budget_min} onChangeText={(v) => set("budget_min", v)} placeholder={t("الميزانية من")} keyboardType="numeric" /><Field value={form.budget_max} onChangeText={(v) => set("budget_max", v)} placeholder={t("الميزانية إلى")} keyboardType="numeric" /></View><Field value={form.description} onChangeText={(v) => set("description", v)} placeholder={t("وصف الطلب")} multiline /></> : <><Field value={form.subject} onChangeText={(v) => set("subject", v)} placeholder={t("موضوع التذكرة")} /><Field value={form.message} onChangeText={(v) => set("message", v)} placeholder={t("اكتب رسالتك")} multiline /></>}<TouchableOpacity disabled={busy} onPress={submit} style={[s.button, { backgroundColor: palette.primary }]}><Text style={s.buttonText}>{busy ? t("جاري الحفظ...") : t(buy ? "نشر طلب الشراء" : "إرسال التذكرة")}</Text></TouchableOpacity>{notice ? <Text style={[s.notice, { color: palette.text }]}>{notice}</Text> : null}<Text style={[s.section, { color: palette.text }]}>{t("السجلات السابقة")}</Text></View>} renderItem={({ item }) => <View style={[s.card, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={s.cardHeader}><Text style={[s.cardTitle, { color: palette.text }]}>{item.title || item.subject}</Text><Text style={[s.status, { color: palette.primary }]}>{item.status}</Text></View><Text style={[s.cardBody, { color: palette.muted }]}>{item.description || item.message}</Text></View>} ListEmptyComponent={!loading ? <Text style={[s.empty, { color: palette.muted }]}>{t("لا توجد بيانات بعد")}</Text> : <ActivityIndicator color={palette.primary} />} /></KeyboardAvoidingView></SafeAreaView>;
mobile/src/screens/WorkflowScreens.js:31:const s = StyleSheet.create({ root: { flex: 1 }, flex: { flex: 1 }, content: { padding: 16, paddingBottom: 40 }, title: { fontSize: 25, fontWeight: "900", marginBottom: 4 }, caption: { fontSize: 13, marginBottom: 14 }, field: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, marginBottom: 10, fontSize: 15 }, multiline: { minHeight: 92, paddingTop: 12, textAlignVertical: "top" }, row: { flexDirection: "row", gap: 8 }, button: { borderRadius: 15, paddingVertical: 14, alignItems: "center", marginTop: 3 }, buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 }, notice: { marginTop: 10, textAlign: "center" }, section: { marginTop: 24, marginBottom: 10, fontSize: 17, fontWeight: "800" }, card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 }, cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10 }, cardTitle: { flex: 1, fontSize: 16, fontWeight: "800" }, status: { fontSize: 12, fontWeight: "800" }, cardBody: { marginTop: 7, lineHeight: 20 }, empty: { textAlign: "center", padding: 30 } });

## Navigation/deep-link markers
frontend/src/pages/AdminPage.js:2:import { useNavigate, Link } from "react-router-dom";
frontend/src/pages/AdminPage.js:10:    const nav = useNavigate();
frontend/src/pages/AdminPage.js:34:        { key: "notifications", label: tr("الإشعارات"), icon: Bell },
frontend/src/pages/AdminPage.js:72:            {tab === "notifications" && <NotificationsPanel />}
frontend/src/pages/AdminPage.js:472:                        <Link to={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="font-arabic font-bold text-sm text-[var(--text)] hover:text-[var(--primary)] block">{l.title}</Link>
frontend/src/pages/AdminPage.js:579:                                            <Link to={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="font-bold text-[var(--text)] hover:text-[var(--primary)] text-xs">{(l.title || "").slice(0, 50)}</Link>
frontend/src/pages/AdminPage.js:644:        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-[var(--border)] text-[var(--text-muted)]"><th className="p-3 text-start">#</th><th className="p-3 text-start">{tr("الإعلان")}</th><th className="p-3 text-start">{tr("الحالة")}</th><th className="p-3 text-start">{tr("تاريخ الإنشاء")}</th><th className="p-3 text-start">{tr("الوسائط")}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-[var(--border)]/50"><td className="p-3"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} /></td><td className="p-3"><Link to={`/listing/${item.id}`} target="_blank" rel="noreferrer" className="font-bold hover:text-[var(--primary)]">{item.title || item.id}</Link></td><td className="p-3">{item.status || "—"}</td><td className="p-3 font-latin">{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</td><td className="p-3 font-latin">{(item.images?.length || 0) + (item.videos?.length || 0)}</td></tr>)}{!loading && items.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)]">{tr("لا توجد إعلانات مطابقة")}</td></tr>}</tbody></table></div></div>
frontend/src/pages/AdminPage.js:713:                            <Link to={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="font-arabic-body text-[var(--text)] hover:text-[var(--primary)] truncate">{l.title || l.id}</Link>
frontend/src/pages/AdminPage.js:885:                                                <Link to={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="font-arabic font-bold text-xs text-[var(--text)] hover:text-[var(--primary)] block truncate">{l.title}</Link>
frontend/src/pages/AdminPage.js:944:                                    <Link to={`/listing/${r.target_id}`} target="_blank" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-1.5 rounded-full text-xs font-bold mt-1">
frontend/src/pages/AdminPage.js:946:                                    </Link>
frontend/src/pages/AdminPage.js:969:            const { data } = await api.get("/admin/notifications/schedule");
frontend/src/pages/AdminPage.js:984:            await api.post("/admin/notifications/schedule", {
frontend/src/pages/AdminPage.js:1000:            await api.delete(`/admin/notifications/schedule/${sid}`);
frontend/src/pages/AdminPage.js:1010:            const { data } = await api.post("/admin/notifications/broadcast", form);
frontend/src/pages/AdminPage.js:1021:            const { data } = await api.get("/admin/notifications/ai-suggest");
frontend/src/pages/AdminPage.js:1033:            const { data } = await api.post("/admin/notifications/test");
frontend/src/pages/AdminPage.js:1063:                            <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1">{tr("رابط الفتح (Deep Link)")}</label>
frontend/src/pages/AuctionsPage.js:2:import { Link, useNavigate, useSearchParams } from "react-router-dom";
frontend/src/pages/AuctionsPage.js:12:    const navigate = useNavigate();
frontend/src/pages/AuctionsPage.js:14:    const [searchParams] = useSearchParams();
frontend/src/pages/AuctionsPage.js:21:    const openBidFor = searchParams.get("openBidFor");
frontend/src/pages/AuctionsPage.js:71:                <Link to="/post" data-testid="auction-create-btn" className="bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] rounded-full px-4 py-1.5 text-xs font-bold font-arabic">
frontend/src/pages/AuctionsPage.js:73:                </Link>
frontend/src/pages/AuctionsPage.js:90:                    <Link to="/post" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-arabic font-bold text-sm">{tr("أنشئ أول مزاد")}</Link>
frontend/src/pages/AuctionsPage.js:109:            <Link to={`/listing/${listing.id}`} className="block aspect-[5/3] bg-[var(--surface-elevated)] overflow-hidden relative">
frontend/src/pages/AuctionsPage.js:121:            </Link>
frontend/src/pages/AuctionsPage.js:164:    const navigate = useNavigate();
frontend/src/pages/AuctionsPage.js:209:            navigate("/login");
frontend/src/pages/Auth.js:2:import { Link, useNavigate, useSearchParams } from "react-router-dom";
frontend/src/pages/Auth.js:158:    const nav = useNavigate();
frontend/src/pages/Auth.js:180:                    <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" />{tr(" الرئيسية")}</Link>
frontend/src/pages/Auth.js:203:                        <Link to="/forgot-password" data-testid="forgot-password-link" className="text-xs text-[var(--primary)] font-bold font-arabic-body">{t("forgot_password")}</Link>
frontend/src/pages/Auth.js:213:                    {t("no_account")} <Link to="/register" data-testid="goto-register" className="text-[var(--primary)] font-bold">{t("register")}</Link>
frontend/src/pages/Auth.js:223:    const nav = useNavigate();
frontend/src/pages/Auth.js:224:    const [searchParams] = useSearchParams();
frontend/src/pages/Auth.js:225:    const refFromUrl = searchParams.get("ref") || "";
frontend/src/pages/Auth.js:277:                    <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" />{tr(" الرئيسية")}</Link>
frontend/src/pages/Auth.js:330:                    {t("already_have_account")} <Link to="/login" data-testid="goto-login" className="text-[var(--primary)] font-bold">{t("login")}</Link>
frontend/src/pages/Auth.js:342:    const [resetLink, setResetLink] = useState("");
frontend/src/pages/Auth.js:351:            if (data.dev_reset_link) setResetLink(data.dev_reset_link);
frontend/src/pages/Auth.js:357:                <Link to="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" />{tr(" العودة")}</Link>
frontend/src/pages/Auth.js:370:                                {resetLink && (
frontend/src/pages/Auth.js:373:                                        <Link to={resetLink} data-testid="dev-reset-link" className="bg-[var(--primary)] text-[var(--primary-fg)] inline-block px-4 py-2 rounded-full text-xs font-bold">{tr("إعادة تعيين الآن")}</Link>
frontend/src/pages/Auth.js:436:    const nav = useNavigate();
frontend/src/pages/CategoryPage.js:2:import { useParams, useSearchParams, Link } from "react-router-dom";
frontend/src/pages/CategoryPage.js:15:    const [searchParams, setSearchParams] = useSearchParams();
frontend/src/pages/CategoryPage.js:23:        subcategory: searchParams.get("sub") || "",
frontend/src/pages/CategoryPage.js:24:        city: searchParams.get("city") || "",
frontend/src/pages/CategoryPage.js:25:        min_price: searchParams.get("min") || "",
frontend/src/pages/CategoryPage.js:26:        max_price: searchParams.get("max") || "",
frontend/src/pages/CategoryPage.js:27:        sort: searchParams.get("sort") || "newest",
frontend/src/pages/CategoryPage.js:28:        days: searchParams.get("days") || "",
frontend/src/pages/CategoryPage.js:102:                <Link to="/" className="text-[var(--text-muted)] hover:text-[var(--primary)]"><ChevronLeft className="w-5 h-5 rotate-180" /></Link>
frontend/src/pages/ChatPage.js:2:import { useSearchParams, Link } from "react-router-dom";
frontend/src/pages/ChatPage.js:13:import { playNotificationSound } from "@/lib/notificationSound";
frontend/src/pages/ChatPage.js:39: * Linkify plain message text: detect http(s) URLs and listing slugs/ids.
frontend/src/pages/ChatPage.js:40: * - Same-origin /listing/* URLs become <Link to="/listing/..."> so the
frontend/src/pages/ChatPage.js:61:                    <Link key={i} to={u.pathname + u.search + u.hash} className="underline text-[var(--primary)] break-all" data-testid="chat-msg-link">
frontend/src/pages/ChatPage.js:63:                    </Link>
frontend/src/pages/ChatPage.js:76:/** Single message bubble — memoised so list updates don't rerender history. */
frontend/src/pages/ChatPage.js:227:    const [searchParams] = useSearchParams();
frontend/src/pages/ChatPage.js:228:    const initialTo = searchParams.get("to");
frontend/src/pages/ChatPage.js:229:    const initialListing = searchParams.get("listing");
frontend/src/pages/ChatPage.js:259:        if (initialListing) return; // explicit deep-link wins
frontend/src/pages/ChatPage.js:373:    // Signature Harajplus sound — see /lib/notificationSound.js
frontend/src/pages/ChatPage.js:680:            <Link to="/login" className="bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-bold">{t("login")}</Link>
frontend/src/pages/ChatPage.js:747:                                <Link to={`/listing/${listingCtx.slug || listingCtx.id}`} className="hp-chat-listing-card" data-testid="chat-listing-context" onClick={(e) => e.stopPropagation()}>
frontend/src/pages/ChatPage.js:761:                                </Link>
frontend/src/pages/DealsPage.js:2:import { Link } from "react-router-dom";
frontend/src/pages/DealsPage.js:55:                    <Link to="/" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-arabic font-bold text-sm">
frontend/src/pages/DealsPage.js:57:                    </Link>
frontend/src/pages/DealsPage.js:70:        <Link to={`/listing/${deal.id}`} data-testid={`deal-card-${deal.id}`} className="group bg-[var(--surface)] rounded-2xl overflow-hidden border border-emerald-500/30 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 transition-all flex flex-col relative">
frontend/src/pages/DealsPage.js:98:        </Link>
frontend/src/pages/FlightsPage.js:1:import { Plane, MapPin, Calendar, Users, Search, ExternalLink, Globe, BadgeCheck } from "lucide-react";
frontend/src/pages/FlightsPage.js:189:    const buildLinks = () => {
frontend/src/pages/FlightsPage.js:205:        const links = buildLinks();
frontend/src/pages/FlightsPage.js:221:    const buildLinksWithTrip = () => {
frontend/src/pages/FlightsPage.js:222:        const base = buildLinks();
frontend/src/pages/FlightsPage.js:223:        // Build trip.com deep link with our affiliate (fallback to standard search)
frontend/src/pages/FlightsPage.js:229:            // If user provided dates, deep-link; else open generic affiliate
frontend/src/pages/FlightsPage.js:231:                window.open(buildLinksWithTrip().trip, "_blank");
frontend/src/pages/FlightsPage.js:302:                                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
frontend/src/pages/HomePage.js:2:import { Link } from "react-router-dom";
frontend/src/pages/HomePage.js:133:                    <Link key={it.label} to={it.to} data-testid={`quick-${it.label}`} className={`relative bg-gradient-to-br ${it.color} rounded-2xl p-3 sm:p-4 border border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5 transition-all flex flex-col items-center gap-1.5`}>
frontend/src/pages/HomePage.js:136:                    </Link>
frontend/src/pages/HomePage.js:160:                            <Link to="/post" data-testid="hero-post-btn" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] rounded-full px-4 sm:px-5 py-2 sm:py-2.5 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 font-arabic">
frontend/src/pages/HomePage.js:162:                            </Link>
frontend/src/pages/HomePage.js:163:                            <Link to="/map" data-testid="hero-map-btn" className="bg-white/10 backdrop-blur border border-white/30 text-white rounded-full px-4 sm:px-5 py-2 sm:py-2.5 font-bold text-xs sm:text-sm hover:bg-white/20 transition-all font-arabic">
frontend/src/pages/HomePage.js:165:                            </Link>
frontend/src/pages/HomePage.js:188:                        <Link key={c.key} to={`/category/${c.key}`} data-testid={`cat-${c.key}`}
frontend/src/pages/HomePage.js:195:                        </Link>
frontend/src/pages/HomePage.js:285:        <Link to={`/listing/${listing.id}`} className="group flex bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg transition-all">
frontend/src/pages/HomePage.js:305:        </Link>
frontend/src/pages/HomePage.js:318:                    <Link to="/register" data-testid="cta-register-btn" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-5 py-2 font-bold text-xs sm:text-sm hover:bg-[var(--primary-hover)] font-arabic">{t("register")}</Link>
frontend/src/pages/ListingDetail.js:2:import { useParams, Link, useNavigate } from "react-router-dom";
frontend/src/pages/ListingDetail.js:4:import { telLink, whatsappLink, normalizePhone } from "@/lib/phone";
frontend/src/pages/ListingDetail.js:43:    const nav = useNavigate();
frontend/src/pages/ListingDetail.js:62:    const [comments, setComments] = useState([]);
frontend/src/pages/ListingDetail.js:110:                api.get(`/listings/${normalizedListing.id}/comments`).then(({ data }) => {
frontend/src/pages/ListingDetail.js:164:            {loadError && <Link to="/" className="inline-flex rounded-full bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 font-bold">{tr("العودة للرئيسية")}</Link>}
frontend/src/pages/ListingDetail.js:206:            const { data } = await api.post(`/listings/${listing.id}/comments`, { text, client_comment_id: requestId });
frontend/src/pages/ListingDetail.js:301:            <Link to="/" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--primary)] mb-4 font-arabic"><ChevronLeft className="w-4 h-4 rotate-180" />{tr(" العودة")}</Link>
frontend/src/pages/ListingDetail.js:407:                    {/* Public comments */}
frontend/src/pages/ListingDetail.js:409:                        <div className="flex items-center justify-between mb-4"><h2 className="font-arabic font-bold text-lg text-[var(--text)]">{tr("التعليقات")}</h2><span className="text-xs text-[var(--text-muted)] font-latin">{comments.length}</span></div>
frontend/src/pages/ListingDetail.js:416:                        {comments.length === 0 ? <p className="text-sm text-[var(--text-muted)] font-arabic-body">{tr("لا توجد تعليقات بعد")}</p> : <div className="space-y-3">{comments.map((comment) => <div key={comment.id} className="rounded-2xl bg-[var(--surface-elevated)] p-3"><div className="flex items-center gap-2 mb-1"><span className="font-arabic font-bold text-xs text-[var(--text)]">{comment.author?.name || tr("مستخدم")}</span>{comment.author?.verified && <CheckCircle2 className="w-3 h-3 text-[var(--primary)]" />}<span className="text-[10px] text-[var(--text-muted)] font-latin ms-auto">{new Date(comment.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en")}</span></div><p className="text-sm text-[var(--text)] font-arabic-body whitespace-pre-wrap">{comment.text}</p></div>)}</div>}
frontend/src/pages/ListingDetail.js:491:                                    <Link to={`/seller/${listing.user_id}`} className="hover:text-[var(--primary)] hover:underline">{listing.seller?.name}</Link>
frontend/src/pages/ListingDetail.js:518:                                        <a href={telLink(ph, cc)} className="w-full bg-[var(--success)] hover:opacity-90 text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
frontend/src/pages/ListingDetail.js:521:                                        <a href={whatsappLink(ph, waMsg, cc)} rel="noopener noreferrer" className="w-full bg-[#25D366] text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic hover:opacity-90">
frontend/src/pages/ListingDetail.js:566:                                    <Link to={`/seller/${listing.user_id}`} className="hover:text-[var(--primary)] hover:underline">{listing.seller?.name}</Link>
frontend/src/pages/ListingDetail.js:598:                                                <a data-testid="call-link" href={telLink(ph, cc)} className="w-full bg-[var(--success)] hover:opacity-90 text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
frontend/src/pages/ListingDetail.js:606:                                                <a data-testid="whatsapp-link" href={whatsappLink(ph, waMsg, cc)} rel="noopener noreferrer" className="w-full bg-[#25D366] text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic hover:opacity-90">
frontend/src/pages/PostListing.js:2:import { useNavigate, useSearchParams } from "react-router-dom";
frontend/src/pages/PostListing.js:21:    const nav = useNavigate();
frontend/src/pages/PostListing.js:22:    const [searchParams] = useSearchParams();
frontend/src/pages/PostListing.js:23:    const editId = searchParams.get("edit");
frontend/src/pages/PostListing.js:320:    // them with a push notification after ~10 minutes. Debounced to avoid spam.
frontend/src/pages/ProfilePage.js:2:import { Link, useNavigate } from "react-router-dom";
frontend/src/pages/ProfilePage.js:61:    const nav = useNavigate();
frontend/src/pages/ProfilePage.js:206:                <Link to="/wallet" data-testid="menu-wallet" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:210:                </Link>
frontend/src/pages/ProfilePage.js:211:                <Link to="/notifications" data-testid="menu-notifications" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:215:                </Link>
frontend/src/pages/ProfilePage.js:216:                <Link to="/settings" data-testid="menu-settings" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:220:                </Link>
frontend/src/pages/ProfilePage.js:221:                <Link to="/about" data-testid="menu-about" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:225:                </Link>
frontend/src/pages/ProfilePage.js:226:                <Link to="/terms" data-testid="menu-terms" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:230:                </Link>
frontend/src/pages/ProfilePage.js:231:                <Link to="/privacy" data-testid="menu-privacy" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:235:                </Link>
frontend/src/pages/ProfilePage.js:236:                <Link to="/contact" data-testid="menu-contact" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:240:                </Link>
frontend/src/pages/ProfilePage.js:266:                        <Link to="/post" data-testid="profile-post-cta" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-arabic font-bold text-sm">{t("cta_post")}</Link>
frontend/src/pages/ProfilePage.js:299:                            <Link key={offer.id} to={`/listing/${offer.listing_id}`} className="flex items-center gap-3 bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
frontend/src/pages/ProfilePage.js:316:                            </Link>
frontend/src/pages/ReelsPage.js:2:import { Link, useNavigate } from "react-router-dom";
frontend/src/pages/ReelsPage.js:10:    const nav = useNavigate();
frontend/src/pages/ReelsPage.js:70:                <Link to="/post" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2.5 rounded-full font-arabic font-bold text-sm">{tr("أنشر إعلان بفيديو")}</Link>
frontend/src/pages/ReelsPage.js:81:            <Link to="/post?video=1" data-testid="reels-upload-btn" aria-label={tr("ارفع ستوري فيديو")} className="absolute top-3 end-3 z-30 flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-2 rounded-full shadow-lg hover:scale-105 transition-transform">
frontend/src/pages/ReelsPage.js:84:            </Link>
frontend/src/pages/ReelsPage.js:92:                            <Link to={`/listing/${l.id}`} className="block text-white mb-3">
frontend/src/pages/ReelsPage.js:96:                            </Link>
frontend/src/pages/ReelsPage.js:101:                                <Link
frontend/src/pages/ReelsPage.js:107:                                </Link>
frontend/src/pages/SearchAndMap.js:2:import { Link, useSearchParams } from "react-router-dom";
frontend/src/pages/SearchAndMap.js:97:    const [searchParams, setSearchParams] = useSearchParams();
frontend/src/pages/SearchAndMap.js:101:    const [q, setQ] = useState(searchParams.get("q") || "");
frontend/src/pages/SearchAndMap.js:107:    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
frontend/src/pages/SearchAndMap.js:108:    const [days, setDays] = useState(searchParams.get("days") || "");
frontend/src/pages/SearchAndMap.js:109:    const [minPrice, setMinPrice] = useState(searchParams.get("min") || "");
frontend/src/pages/SearchAndMap.js:110:    const [maxPrice, setMaxPrice] = useState(searchParams.get("max") || "");
frontend/src/pages/SearchAndMap.js:134:                // Geonames-backed location filter — pick the deepest selected level as the `city` server filter.
frontend/src/pages/SearchAndMap.js:321:                                    <Link to={`/listing/${it.id}`} className="text-xs text-[var(--primary)] underline">{tr("عرض الإعلان")}</Link>
frontend/src/pages/SnapAuthCallback.js:2:import { useNavigate, useSearchParams } from "react-router-dom";
frontend/src/pages/SnapAuthCallback.js:8:    const nav = useNavigate();
frontend/src/pages/StaticPages.js:1:import { Link, useNavigate } from "react-router-dom";
frontend/src/pages/StaticPages.js:14:    const nav = useNavigate();
frontend/src/pages/StaticPages.js:35:                <Link to="/profile" className="text-[var(--text-muted)]"><ArrowLeft className="w-5 h-5" /></Link>
frontend/src/pages/StaticPages.js:68:                    <Link key={it.label} to={it.to} data-testid={`settings-${it.label}`} className="flex items-center gap-3 p-4 hover:bg-[var(--surface-elevated)]">
frontend/src/pages/StaticPages.js:75:                    </Link>
frontend/src/pages/StaticPages.js:91:            <Link to="/profile" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" />{tr(" العودة")}</Link>
frontend/src/pages/VerifyEmailPage.js:2:import { useSearchParams, Link } from "react-router-dom";
frontend/src/pages/VerifyEmailPage.js:34:                        <Link to="/" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-2.5 rounded-full font-arabic font-bold text-sm">{tr("الذهاب للرئيسية")}</Link>
frontend/src/pages/VerifyEmailPage.js:42:                        <Link to="/login" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-2.5 rounded-full font-arabic font-bold text-sm">{tr("العودة لتسجيل الدخول")}</Link>
frontend/src/pages/WalletPage.js:6:import { Link } from "react-router-dom";
frontend/src/pages/WalletPage.js:48:                <Link to="/login" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-2.5 rounded-full font-arabic font-bold text-sm">
frontend/src/pages/WalletPage.js:50:                </Link>
frontend/src/pages/WalletPage.js:100:                <Link to="/my-listings" data-testid="boost-listing-link" className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
frontend/src/pages/WalletPage.js:104:                </Link>
frontend/src/pages/XAuthCallback.js:2:import { useNavigate, useSearchParams } from "react-router-dom";
frontend/src/pages/XAuthCallback.js:8:    const nav = useNavigate();
frontend/src/pages/SellerStorefrontPage.js:2:import { Link, useParams } from "react-router-dom";
frontend/src/pages/SellerStorefrontPage.js:35:                        <Link to={`/chat?to=${seller.id}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-fg)] font-arabic font-bold text-sm"><MessageCircle className="w-4 h-4" />{tr("تواصل مع المتجر")}</Link>
frontend/src/pages/SellerStorefrontPage.js:41:            <section><div className="flex items-center justify-between mb-3"><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("كتالوج المتجر")}</h2><span className="text-xs text-[var(--text-muted)] font-arabic-body">{items.length} {tr("إعلان")}</span></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">{items.map((item) => <Link key={item.id} to={`/listing/${item.id}`} className="bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] hover:-translate-y-0.5 hover:shadow-lg transition-all"><div className="aspect-[4/3] bg-[var(--surface-elevated)]">{item.images?.[0] && <img src={item.images[0]} alt={item.title || ""} className="w-full h-full object-cover" loading="lazy" />}</div><div className="p-3"><div className="font-arabic font-bold text-sm text-[var(--text)] line-clamp-2 min-h-10">{item.title}</div><div className="mt-2 flex justify-between gap-2 text-xs"><b className="font-latin text-[var(--primary)]">{item.price ? `${Number(item.price).toLocaleString()} ${item.currency || ""}` : tr("السعر عند التواصل")}</b><span className="text-[var(--text-muted)]">{item.views || 0} {tr("مشاهدة")}</span></div></div></Link>)}</div>{items.length === 0 && <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center text-[var(--text-muted)] font-arabic-body">{tr("لا توجد إعلانات نشطة")}</div>}</section>
frontend/src/pages/NotificationsPage.js:2:import { Link } from "react-router-dom";
frontend/src/pages/NotificationsPage.js:8:import { notificationUrl } from "@/lib/notificationLinks";
frontend/src/pages/NotificationsPage.js:20:    const load = useCallback(async () => { if (!user) return; setLoading(true); try { const { data } = await api.get("/notifications", { params: { limit: 100 } }); setItems(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])); } catch (_) { setItems([]); } finally { setLoading(false); } }, [user]);
frontend/src/pages/NotificationsPage.js:22:    const markOne = async (id) => { setItems((xs) => xs.map((n) => n.id === id ? { ...n, read: true } : n)); try { await api.post(`/notifications/${id}/read`); } catch (_) {} };
frontend/src/pages/NotificationsPage.js:23:    const markAll = async () => { try { await api.post("/notifications/read-all"); setItems((xs) => xs.map((n) => ({ ...n, read: true }))); } catch (_) {} };
frontend/src/pages/NotificationsPage.js:25:    return <main className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-6 pb-24 overflow-x-hidden" dir={direction} data-testid="notifications-page"><div className="flex items-center justify-between mb-5"><div><h1 className="font-arabic font-black text-2xl text-[var(--text)] flex items-center gap-2"><Bell className="w-6 h-6 text-[var(--primary)]" />{tr("الإشعارات")}</h1><p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{tr("رسائل فورية، عروض، تحديثات الإعلانات والتنبيهات المهمة")}</p></div>{items.some((n) => !n.read) && <button onClick={markAll} className="px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-arabic font-bold flex items-center gap-1"><CheckCheck className="w-4 h-4" />{tr("تعليم الكل كمقروء")}</button>}</div>{loading ? <div className="py-16 text-center text-[var(--text-muted)] font-arabic-body">{tr("جاري التحميل...")}</div> : items.length === 0 ? <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center text-[var(--text-muted)] font-arabic-body"><Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />{tr("لا توجد إشعارات بعد")}</div> : <div className="w-full max-w-2xl mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">{items.map((n) => { const Icon = ICONS[n.type] || Bell; return <Link key={n.id} to={notificationUrl(n)} onClick={() => !n.read && markOne(n.id)} className={`flex gap-3 p-4 min-w-0 overflow-hidden border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-elevated)] ${!n.read ? "bg-[var(--primary)]/5" : ""}`}><div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center shrink-0 text-[var(--primary)]"><Icon className="w-5 h-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2 min-w-0"><h2 className="font-arabic font-bold text-sm text-[var(--text)] truncate min-w-0">{n.title}</h2>{!n.read && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}</div>{n.body && <p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{n.body}</p>}<time className="block text-[10px] text-[var(--text-muted)] mt-2">{new Date(n.created_at || n.ts).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}</time></div>{!n.read && <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />}</Link>; })}</div>}</main>;
frontend/src/pages/AccountCollectionPage.js:2:import { Link, useLocation } from "react-router-dom";
frontend/src/pages/AccountCollectionPage.js:3:import { Bookmark, Heart, List, RefreshCw, Search, Tag, Users, ExternalLink } from "lucide-react";
frontend/src/pages/AccountCollectionPage.js:74:      {!busy && !error && rows.length === 0 && <div className="py-20 text-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]"><Search className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" /><p className="font-arabic font-bold text-[var(--text)]">{t("لا توجد بيانات بعد")}</p><Link to="/" className="inline-flex mt-4 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-fg)] font-arabic font-bold text-sm">{t("استكشف الإعلانات")}</Link></div>}
frontend/src/pages/AccountCollectionPage.js:81:      {!busy && otherRows.length > 0 && <div className="space-y-3 mt-2">{otherRows.map((row, index) => <div key={row.id || row.search_id || row.user_id || index} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between gap-3"><div className="min-w-0"><p className="font-arabic font-bold text-[var(--text)] truncate">{row.name || row.title || row.query || row.keyword || t("عنصر محفوظ")}</p><p className="text-xs text-[var(--text-muted)] font-arabic-body truncate">{row.description || row.city || row.country_code || row.status || ""}</p></div>{(row.listing_id || row.id) && config.key === "offers" && <Link to={`/listing/${row.listing_id || row.id}`} className="shrink-0 p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]" aria-label={t("فتح الإعلان")}><ExternalLink className="w-4 h-4" /></Link>}</div>)}</div>}
frontend/src/components/AuthCallback.js:2:import { useNavigate, useSearchParams } from "react-router-dom";
frontend/src/components/AuthCallback.js:41:    const nav = useNavigate();
frontend/src/components/AuthCallback.js:43:    const [searchParams] = useSearchParams();
frontend/src/components/AuthCallback.js:53:        const queryError = searchParams.get("error");
frontend/src/components/AuthCallback.js:78:            window.history.replaceState({}, "", "/");
frontend/src/components/AuthCallback.js:88:                // Tokens saved but /me failed — could be cold start.
frontend/src/components/AuthCallback.js:94:    }, [nav, refresh, searchParams]);
frontend/src/components/CountryPicker.js:13: * also synced to /users/me so push notifications / recommendations target the
frontend/src/components/LocationPicker.jsx:97:                // sub-districts), re-query with the next deeper level too.
frontend/src/components/NotificationBell.js:2:import { Link } from "react-router-dom";
frontend/src/components/NotificationBell.js:8:import { playNotificationSound } from "@/lib/notificationSound";
frontend/src/components/NotificationBell.js:9:import { notificationUrl } from "@/lib/notificationLinks";
frontend/src/components/NotificationBell.js:14: * - Polls /api/notifications every 60s (cheap, just an unread count).
frontend/src/components/NotificationBell.js:17: * - Dropdown lists the latest 20 notifications with deep-links.
frontend/src/components/NotificationBell.js:53:            const { data } = await api.get("/notifications", { params: { limit: 20 } });
frontend/src/components/NotificationBell.js:96:            await api.post("/notifications/read-all");
frontend/src/components/NotificationBell.js:105:        try { await api.post(`/notifications/${id}/read`); } catch (_) {}
frontend/src/components/NotificationBell.js:148:                                <Link
frontend/src/components/NotificationBell.js:150:                                    to={notificationUrl(n)}
frontend/src/components/NotificationBell.js:164:                                </Link>
frontend/src/components/NotificationsPanel.js:11:    "no-notification-api": "متصفحك لا يدعم نظام الإشعارات",
frontend/src/components/NotificationsPanel.js:19: *   2. Per-event preferences (messages, listing_status, deals, watchlist, broadcasts, comments).
frontend/src/components/NotificationsPanel.js:27:    { key: "comments", label: "التعليقات والردود" },
frontend/src/components/NotificationsPanel.js:78:        <div data-testid="notifications-panel" className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 mb-3">
frontend/src/components/SEO.js:66:            {/* Mobile app deep-link — iOS Smart Banner + Android App Link hints */}
frontend/src/components/SmartAppBanner.js:40:    // Try the universal deep-link first; if the app isn't installed we fall
frontend/src/components/SmartAppBanner.js:47:        const deepLink = `harajplus:/${path}`;
frontend/src/components/SmartAppBanner.js:50:        window.location.href = deepLink;
frontend/src/components/SmartAppBanner.js:63:    // (deep-link try). Hide only on dismiss or non-mobile platforms.
frontend/src/components/layout/BottomNav.js:1:import { Link, useLocation } from "react-router-dom";
frontend/src/components/layout/BottomNav.js:60:            <Link
frontend/src/components/layout/BottomNav.js:88:            </Link>
frontend/src/components/layout/BottomNav.js:95:            <Link
frontend/src/components/layout/BottomNav.js:114:            </Link>
frontend/src/components/layout/TopBar.js:1:import { Link, useNavigate } from "react-router-dom";
frontend/src/components/layout/TopBar.js:14:    const nav = useNavigate();
frontend/src/components/layout/TopBar.js:152:                <Link to="/" className="flex items-baseline gap-1 select-none shrink-0" data-testid="logo-link">
frontend/src/components/layout/TopBar.js:154:                </Link>
frontend/src/components/layout/TopBar.js:202:                            {history.length > 0 && (
frontend/src/components/layout/TopBar.js:208:                                    {history.map((h) => (
frontend/src/components/layout/TopBar.js:219:                                <div className={history.length > 0 ? "border-t border-[var(--border)] mt-1 pt-1" : ""}>
frontend/src/components/layout/TopBar.js:231:                            {history.length === 0 && trending.length === 0 && autoSugg.length === 0 && (
frontend/src/components/layout/TopBar.js:285:                    <Link to="/login" data-testid="login-cta" className="bg-[var(--secondary)] dark:bg-[var(--accent)] text-white dark:text-[#0A1128] px-2.5 sm:px-4 py-1.5 rounded-full font-bold text-[11px] sm:text-xs hover:scale-105 hover:shadow-lg transition-all font-arabic shrink-0 border border-white/15 whitespace-nowrap">
frontend/src/components/layout/TopBar.js:288:                    </Link>
frontend/src/components/listings/ListingCard.js:1:import { Link } from "react-router-dom";
frontend/src/components/listings/ListingCard.js:52:        <Link
frontend/src/components/listings/ListingCard.js:102:        </Link>
frontend/src/components/ui/breadcrumb.jsx:31:const BreadcrumbLink = React.forwardRef(({ asChild, className, ...props }, ref) => {
frontend/src/components/ui/breadcrumb.jsx:41:BreadcrumbLink.displayName = "BreadcrumbLink"
frontend/src/components/ui/breadcrumb.jsx:88:  BreadcrumbLink,
frontend/src/components/ui/navigation-menu.jsx:63:const NavigationMenuLink = NavigationMenuPrimitive.Link
frontend/src/components/ui/navigation-menu.jsx:101:  NavigationMenuLink,
frontend/src/components/ui/pagination.jsx:32:const PaginationLink = ({
frontend/src/components/ui/pagination.jsx:46:PaginationLink.displayName = "PaginationLink"
frontend/src/components/ui/pagination.jsx:52:  <PaginationLink
frontend/src/components/ui/pagination.jsx:59:  </PaginationLink>
frontend/src/components/ui/pagination.jsx:67:  <PaginationLink
frontend/src/components/ui/pagination.jsx:74:  </PaginationLink>
frontend/src/components/ui/pagination.jsx:95:  PaginationLink,
mobile/src/AuthContext.js:2:import * as Linking from "expo-linking";
mobile/src/AuthContext.js:24:    // Capture tokens from a deep-link if the user returns to the app via
mobile/src/AuthContext.js:26:    // (cold-launch case). Hot-launch is handled inline by socialAuth.js, but
mobile/src/AuthContext.js:41:        const sub = Linking.addEventListener("url", (e) => handle(e.url));
mobile/src/AuthContext.js:42:        Linking.getInitialURL().then(handle);
mobile/src/I18nContext.js:62:        "إرسال رابط الاستعادة": "Send Reset Link",
mobile/src/I18nContext.js:361:        "لا توجد إشعارات": "No notifications",
mobile/src/I18nContext.js:1866:        "إعدادات الإشعارات": "Paramètres des notifications",
mobile/src/I18nContext.js:2161:        "لا توجد إشعارات": "Aucune notification",
mobile/src/components/FloatingTabBar.js:113:    navigation.getParent()?.navigate("Post");
mobile/src/components/FloatingTabBar.js:174:              if (!focused && !ev.defaultPrevented) navigation.navigate(tab.name);
mobile/src/components/ListingCard.js:47:      nav.navigate("Login");
mobile/src/components/ListingCard.js:70:    return <TouchableOpacity activeOpacity={0.9} onPress={() => nav.navigate("ListingDetail", {
mobile/src/components/ListingCard.js:91:  return <TouchableOpacity activeOpacity={0.85} onPress={() => nav.navigate("ListingDetail", {
mobile/src/components/LocationPicker.js:128:        // selected parent, try the next deeper level too (handles
mobile/src/components/NotificationBell.js:2:// Polls GET /api/notifications/unread-count when the host screen comes into
mobile/src/components/NotificationBell.js:10:import { onNotificationReceived } from "../notifications";
mobile/src/components/NotificationBell.js:20:        api.get("/notifications/unread-count")
mobile/src/components/NotificationBell.js:29:    // Live refresh whenever a push notification arrives — no reload needed.
mobile/src/components/NotificationBell.js:37:            onPress={() => nav.navigate(user ? "Notifications" : "Login")}
mobile/src/components/NotificationBell.js:39:            testID="notification-bell-btn"
mobile/src/components/NotificationBell.js:45:                <View style={styles.badge} testID="notification-bell-badge">
mobile/src/components/StandaloneFloatingTabBar.js:58:    nav.navigate("Main", { screen: tabName });
mobile/src/components/StandaloneFloatingTabBar.js:78:    nav.navigate("Post");
mobile/src/notifications.js:1:import * as Notifications from "expo-notifications";
mobile/src/notifications.js:3:import * as Linking from "expo-linking";
mobile/src/notifications.js:10:// fully closed (cold start).
mobile/src/notifications.js:23: * Route a tapped notification → navigate to the listing/chat/etc.
mobile/src/notifications.js:25: * "/chat?to=xyz"). We open it via the harajplus:// scheme so deep-link
mobile/src/notifications.js:61:    // A terminated-app notification may be processed before onReady. Keep the
mobile/src/notifications.js:62:    // route instead of falling back to Linking.openURL and losing navigation.
mobile/src/notifications.js:67:    // Listing detail, including comment deep-links.
mobile/src/notifications.js:70:        const isComments = /(?:#comments|[?&](?:focus|section)=comments)/i.test(url);
mobile/src/notifications.js:71:        _navigationRef.navigate("ListingDetail", { id: m[1], focus: isComments ? "comments" : undefined });
mobile/src/notifications.js:76:    if (m && _navigationRef?.navigate) { _navigationRef.navigate("SellerProfile", { sellerId: m[1] }); return; }
mobile/src/notifications.js:81:        _navigationRef.navigate("Chat", to ? { to } : {});
mobile/src/notifications.js:84:    if (url === "/notifications" || url.startsWith("/notifications?")) {
mobile/src/notifications.js:85:        _navigationRef.navigate("Notifications");
mobile/src/notifications.js:90:        _navigationRef.navigate("Main", { screen: "ReelsTab" });
mobile/src/notifications.js:102:        _navigationRef.navigate(topRoute[1]);
mobile/src/notifications.js:107:        if (_navigationRef?.navigate) { _navigationRef.navigate("Post"); return; }
mobile/src/notifications.js:109:    // Comment notifications without a listing id still land in the comments inbox.
mobile/src/notifications.js:110:    if (url === "/comments" || url.startsWith("/comments?")) {
mobile/src/notifications.js:111:        _navigationRef.navigate("Notifications");
mobile/src/notifications.js:118:        _navigationRef.navigate("Search", q ? { q } : {});
mobile/src/notifications.js:123:        _navigationRef.navigate("Search", { category: decodeURIComponent(m[1]) });
mobile/src/notifications.js:126:    // Fallback — try built-in deep linking
mobile/src/notifications.js:127:    try { Linking.openURL(`harajplus://${url.startsWith("/") ? url.slice(1) : url}`); } catch (_) {}
mobile/src/notifications.js:134:    // Tap on a foreground/background notification
mobile/src/notifications.js:136:        const data = response?.notification?.request?.content?.data || {};
mobile/src/notifications.js:139:    // Fired the moment a notification arrives — let UI badges refresh live.
mobile/src/notifications.js:143:    // Cold start — app opened from a notification
mobile/src/notifications.js:145:        const data = response?.notification?.request?.content?.data || {};
mobile/src/notifications.js:154:            // Owner mandate: notifications must play sound + arrive when
mobile/src/screens/AuctionsScreen.js:51:  // bid sheet automatically. Useful for deep-links from the listing CTA.
mobile/src/screens/AuctionsScreen.js:101:                <TouchableOpacity onPress={() => nav.navigate("Post")} style={styles.createBtn}>
mobile/src/screens/AuctionsScreen.js:129:            <TouchableOpacity onPress={() => nav.navigate("ListingDetail", {
mobile/src/screens/AuctionsScreen.js:227:      nav.navigate("Login");
mobile/src/screens/AuthScreens.js:31:  try { navigation.navigate("Main"); } catch (_) {}
mobile/src/screens/AuthScreens.js:138:  // (e.g., social OAuth deep-link returns a token), navigate to Main
mobile/src/screens/AuthScreens.js:264:                    <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.linkWrap}>
mobile/src/screens/AuthScreens.js:267:                    <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={{
mobile/src/screens/AuthScreens.js:360:                    <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.linkWrap}>
mobile/src/screens/ChatScreen.js:6:import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StatusBar, StyleSheet, RefreshControl, Modal, Linking, PanResponder, Animated } from "react-native";
mobile/src/screens/ChatScreen.js:75: * that call Linking.openURL on tap. Same-origin links could be parsed and
mobile/src/screens/ChatScreen.js:78:function renderLinkedText(text, isMine) {
mobile/src/screens/ChatScreen.js:89:          onPress={() => Linking.openURL(part).catch(() => {})}
mobile/src/screens/ChatScreen.js:255:                <TouchableOpacity onPress={() => nav.navigate("Login")} style={s.guestBtn}>
mobile/src/screens/ChatScreen.js:548:  // bottom. Incoming messages must never pull the user away from older history.
mobile/src/screens/ChatScreen.js:900:            {listing && <TouchableOpacity onPress={() => listing.id && nav.navigate("ListingDetail", {
mobile/src/screens/ChatScreen.js:1213:                    </TouchableOpacity> : isVoice && url ? <VoicePlayer url={url} isMine={isMine} duration_ms={m.voice_duration_ms} /> : isLocation && url ? <TouchableOpacity onPress={() => Linking.openURL(url)} style={s.locationBubble}>
mobile/src/screens/ChatScreen.js:1220:      }]} selectable>{renderLinkedText(text, isMine)}</Text> : null}
mobile/src/screens/FlightsScreen.js:3:import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, FlatList, Linking, Alert, Platform } from "react-native";
mobile/src/screens/FlightsScreen.js:6:import { Plane, MapPin, Calendar, Users, Search, ExternalLink, Globe, X, BadgeCheck } from "lucide-react-native";
mobile/src/screens/FlightsScreen.js:414:    Linking.openURL(url).catch(() => {});
mobile/src/screens/FlightsScreen.js:544:                            <ExternalLink size={13} color="rgba(255,255,255,0.7)" />
mobile/src/screens/HomeScreen.js:209:        nav.navigate("Search", { q });
mobile/src/screens/HomeScreen.js:243:            <TouchableOpacity onPress={() => nav.navigate("Search")} style={styles.searchBox} testID="home-search-box">
mobile/src/screens/HomeScreen.js:260:            <TouchableOpacity onPress={() => nav.navigate("AIAssistant")} style={styles.aiPill} testID="home-ai-assistant">
mobile/src/screens/HomeScreen.js:327:                        <TouchableOpacity onPress={() => nav.navigate("Post")} style={styles.heroPrimaryBtn}>
mobile/src/screens/HomeScreen.js:331:                        <TouchableOpacity onPress={() => nav.navigate("Map")} style={styles.heroSecondaryBtn}>
mobile/src/screens/HomeScreen.js:379:            {items.map(it => <TouchableOpacity key={it.label} onPress={() => nav.navigate(it.to)} style={styles.quickItem} activeOpacity={0.85} testID={`home-quick-${it.to}`}>
mobile/src/screens/HomeScreen.js:423:        return <TouchableOpacity key={c.key} onPress={() => nav.navigate("CategoryListings", {
mobile/src/screens/HomeScreen.js:456:                <TouchableOpacity onPress={() => nav.navigate("Login")} style={styles.ctaBtn}>
mobile/src/screens/ListingDetailScreen.js:2:import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert, Share, FlatList, Dimensions, Modal, TextInput, PanResponder } from "react-native";
mobile/src/screens/ListingDetailScreen.js:55:  const [comments, setComments] = useState([]);
mobile/src/screens/ListingDetailScreen.js:60:  const [commentsY, setCommentsY] = useState(null);
mobile/src/screens/ListingDetailScreen.js:73:        api.get(`/listings/${id}/comments`).then(({ data }) => setComments(data?.items || [])).catch(() => {});
mobile/src/screens/ListingDetailScreen.js:94:    if (route.params?.focus !== "comments" || commentsY == null || !listing) return;
mobile/src/screens/ListingDetailScreen.js:95:    const timer = setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, commentsY - 24), animated: true }), 120);
mobile/src/screens/ListingDetailScreen.js:97:  }, [route.params?.focus, commentsY, listing]);
mobile/src/screens/ListingDetailScreen.js:136:  const call = () => _normalizedPhone && Linking.openURL(`tel:${_normalizedPhone}`);
mobile/src/screens/ListingDetailScreen.js:137:  const wa = () => _normalizedPhone && Linking.openURL(`https://wa.me/${_normalizedPhone.replace("+", "")}?text=${encodeURIComponent(`${t("مرحباً بخصوص:")} ${listing.title}`)}`);
mobile/src/screens/ListingDetailScreen.js:149:    if (!user) { navigation.navigate("Login"); return; }
mobile/src/screens/ListingDetailScreen.js:163:    if (!user) { navigation.navigate("Login"); return; }
mobile/src/screens/ListingDetailScreen.js:168:      const { data } = await api.post(`/listings/${id}/comments`, { text });
mobile/src/screens/ListingDetailScreen.js:227:      navigation.navigate("Login");
mobile/src/screens/ListingDetailScreen.js:272:    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`);
mobile/src/screens/ListingDetailScreen.js:287:          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Main")}
mobile/src/screens/ListingDetailScreen.js:338:                    <TouchableOpacity onPress={() => navigation.navigate("Post", {
mobile/src/screens/ListingDetailScreen.js:400:                    <View style={styles.engagementBtn}><MessageCircle size={16} color={theme.colors.textMuted} /><Text style={styles.engagementText}>{comments.length}</Text></View>
mobile/src/screens/ListingDetailScreen.js:421:                </View> : <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.commentLogin}><Text style={styles.commentLoginText}>{t("سجل الدخول لكتابة تعليق")}</Text></TouchableOpacity>}
mobile/src/screens/ListingDetailScreen.js:422:                {comments.length === 0 ? <Text style={styles.emptyComments}>{t("لا توجد تعليقات بعد")}</Text> : comments.map(comment => <View key={comment.id} style={styles.commentCard}><View style={styles.commentMeta}><Text style={styles.commentAuthor}>{comment.author?.name || t("مستخدم")}</Text>{comment.author?.verified && <CheckCircle2 size={13} color={theme.colors.primary} />}<Text style={styles.commentDate}>{new Date(comment.created_at).toLocaleDateString()}</Text></View><Text style={styles.commentBody}>{comment.text}</Text></View>)}
mobile/src/screens/ListingDetailScreen.js:425:                <TouchableOpacity onPress={() => listing.seller?.id && navigation.navigate("SellerProfile", {
mobile/src/screens/ListingDetailScreen.js:454:          navigation.navigate("Login");
mobile/src/screens/ListingDetailScreen.js:458:        navigation.navigate("Chat", {
mobile/src/screens/ListingDetailScreen.js:566:                  if (!user) { navigation.navigate("Login"); return; }
mobile/src/screens/ListingDetailScreen.js:569:                  navigation.navigate("Auctions", { openBidFor: listing.id });
mobile/src/screens/ListingDetailScreen.js:582:                    if (!user) { navigation.navigate("Login"); return; }
mobile/src/screens/ListingDetailScreen.js:583:                    navigation.navigate("Chat", {
mobile/src/screens/MapScreen.js:63:        nav.navigate("ListingDetail", {
mobile/src/screens/MoreScreens.js:143:    api.get("/notifications").then(({
mobile/src/screens/MoreScreens.js:149:      await api.post(`/notifications/${n.id}/read`);
mobile/src/screens/MoreScreens.js:151:    // Owner mandate: tapping a notification MUST navigate to the relevant
mobile/src/screens/MoreScreens.js:162:        if (m) { navigation.navigate("ListingDetail", { id: m[1] }); return; }
mobile/src/screens/MoreScreens.js:164:        if (m) { navigation.navigate("SellerProfile", { sellerId: m[1] }); return; }
mobile/src/screens/MoreScreens.js:166:        if (m) { navigation.navigate("Chat", m[1] ? { to: m[1] } : {}); return; }
mobile/src/screens/MoreScreens.js:168:        if (m) { navigation.navigate("Search", { category: decodeURIComponent(m[1]) }); return; }
mobile/src/screens/MoreScreens.js:169:        if (url.startsWith("/post")) { navigation.navigate("Post"); return; }
mobile/src/screens/MoreScreens.js:171:        if (m) { navigation.navigate("Search", m[1] ? { q: decodeURIComponent(m[1]) } : {}); return; }
mobile/src/screens/MoreScreens.js:174:    // 2) Type-based fallback (legacy notifications without `url`).
mobile/src/screens/MoreScreens.js:178:      if (to) { navigation.navigate("Chat", { to }); return; }
mobile/src/screens/MoreScreens.js:182:      if (id) { navigation.navigate("ListingDetail", { id }); return; }
mobile/src/screens/MoreScreens.js:186:      if (id) { navigation.navigate("ListingDetail", { id }); return; }
mobile/src/screens/MoreScreens.js:187:      navigation.navigate("Auctions");
mobile/src/screens/MoreScreens.js:193:      navigation.navigate("ListingDetail", { id: n.reference_id });
mobile/src/screens/MoreScreens.js:196:  // Visual icon + tint per notification type — clean baby-blue family.
mobile/src/screens/MoreScreens.js:270:                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("SavedSearches")}>
mobile/src/screens/MoreScreens.js:273:                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("Following")}>
mobile/src/screens/MoreScreens.js:276:                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("NotifSettings")}>
mobile/src/screens/MoreScreens.js:279:                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("Notifications")}>
mobile/src/screens/MoreScreens.js:282:                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("StaticPage", {
mobile/src/screens/MoreScreens.js:287:                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("StaticPage", {
mobile/src/screens/MoreScreens.js:292:                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("StaticPage", {
mobile/src/screens/MoreScreens.js:297:                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("StaticPage", {
mobile/src/screens/MoreScreens.js:491:  // New card-based notification design — soft shadow + 20 radius + icon avatar.
mobile/src/screens/MoreScreens.js:630:                        <TouchableOpacity onPress={() => navigation.navigate("Search", {
mobile/src/screens/MoreScreens.js:716:                        <TouchableOpacity onPress={() => navigation.navigate("CategoryListings", {
mobile/src/screens/MoreScreens.js:749:      return <TouchableOpacity key={s2.seller_id} style={s.menuItem} onPress={() => navigation.navigate("SellerProfile", {
mobile/src/screens/MoreScreens.js:767:    api.get("/users/me/notifications/settings").then(({
mobile/src/screens/MoreScreens.js:781:      await api.put("/users/me/notifications/settings", {
mobile/src/screens/PasswordReset.js:41:                        <TouchableOpacity onPress={() => navigation.navigate("ResetPassword")} style={styles.btn}>
mobile/src/screens/PasswordReset.js:50:                <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{
mobile/src/screens/PasswordReset.js:80:      navigation.navigate("Login");
mobile/src/screens/PostScreen.js:111:                <TouchableOpacity onPress={() => navigation.navigate("Login")} style={s.guestBtn}>
mobile/src/screens/PostScreen.js:510:  // with a push notification if they abandon the flow for ~10 minutes.
mobile/src/screens/ProfileScreen.js:10:import { Platform, Linking } from "react-native";
mobile/src/screens/ProfileScreen.js:73:                        <TouchableOpacity onPress={() => nav.navigate("Login")} style={s.guestPrimaryBtn}>
mobile/src/screens/ProfileScreen.js:76:                        <TouchableOpacity onPress={() => nav.navigate("Register")} style={s.guestSecondaryBtn}>
mobile/src/screens/ProfileScreen.js:117:        nav.navigate("HomeTab");
mobile/src/screens/ProfileScreen.js:178:            <TouchableOpacity onPress={() => nav.navigate("Wallet")} style={[s.walletCard, shadow.card]}>
mobile/src/screens/ProfileScreen.js:196:            {coins && <TouchableOpacity onPress={() => nav.navigate("Wallet")} style={[s.coinsCard, shadow.card]} testID="profile-coins-card">
mobile/src/screens/ProfileScreen.js:204:                <QuickTile icon={ListIcon} label={t("إعلاناتي")} tint="#3B82F6" tintBg="#DBEAFE" onPress={() => nav.navigate("MyListings")} />
mobile/src/screens/ProfileScreen.js:205:                <QuickTile icon={Heart} label={t("المفضلة")} tint="#EF4444" tintBg="#FEE2E2" onPress={() => nav.navigate("Favorites")} />
mobile/src/screens/ProfileScreen.js:206:                <QuickTile icon={Sparkles} label={t("المساعد")} tint={colors.primary} tintBg="rgba(137,207,240,0.18)" onPress={() => nav.navigate("AIAssistant")} />
mobile/src/screens/ProfileScreen.js:207:                <QuickTile icon={Gavel} label={t("المزادات")} tint="#F59E0B" tintBg="#FEF3C7" onPress={() => nav.navigate("Auctions")} />
mobile/src/screens/ProfileScreen.js:208:                <QuickTile icon={Tag} label={t("العروض")} tint="#0EA5E9" tintBg="#E0F2FE" onPress={() => nav.navigate("Offers")} />
mobile/src/screens/ProfileScreen.js:209:                <QuickTile icon={Plane} label={t("الطيران")} tint="#0EA5E9" tintBg="#E0F2FE" onPress={() => nav.navigate("Flights")} />
mobile/src/screens/ProfileScreen.js:210:                <QuickTile icon={Flame} label={t("الصفقات")} tint="#EF4444" tintBg="#FEE2E2" onPress={() => nav.navigate("Deals")} />
mobile/src/screens/ProfileScreen.js:211:                <QuickTile icon={MapPin} label={t("الخريطة")} tint="#10B981" tintBg="#D1FAE5" onPress={() => nav.navigate("Map")} />
mobile/src/screens/ProfileScreen.js:212:                <QuickTile icon={Bookmark} label={t("محفوظات")} tint="#8B5CF6" tintBg="#EDE9FE" onPress={() => nav.navigate("SavedSearches")} />
mobile/src/screens/ProfileScreen.js:236:                <MenuRow icon={Bell} label={t("الإشعارات")} onPress={() => nav.navigate("Notifications")} />
mobile/src/screens/ProfileScreen.js:237:                <MenuRow icon={Settings} label={t("الإعدادات")} onPress={() => nav.navigate("Settings")} />
mobile/src/screens/ProfileScreen.js:238:                <MenuRow icon={UsersIcon} label={t("متابعاتي")} onPress={() => nav.navigate("Following")} />
mobile/src/screens/ProfileScreen.js:246:                <MenuRow icon={Info} label={t("عن التطبيق")} onPress={() => nav.navigate("StaticPage", {
mobile/src/screens/ProfileScreen.js:249:                <MenuRow icon={FileText} label={t("الشروط والأحكام")} onPress={() => nav.navigate("StaticPage", {
mobile/src/screens/ProfileScreen.js:252:                <MenuRow icon={Shield} label={t("سياسة الخصوصية")} onPress={() => nav.navigate("StaticPage", {
mobile/src/screens/ProfileScreen.js:255:                <MenuRow icon={Mail} label={t("تواصل معنا")} onPress={() => nav.navigate("StaticPage", {
mobile/src/screens/ProfileScreen.js:276:    const open = (u) => { if (u) Linking.openURL(u).catch(() => {}); };
mobile/src/screens/ReelsScreen.js:114:          else nav.navigate("HomeTab");
mobile/src/screens/ReelsScreen.js:126:                <TouchableOpacity onPress={() => nav.navigate("Post")} style={styles.postCta} testID="reels-empty-post-btn">
mobile/src/screens/ReelsScreen.js:136:              onPress={() => { try { nav.canGoBack?.() ? nav.goBack() : nav.navigate("HomeTab"); } catch (_) {} }}
mobile/src/screens/ReelsScreen.js:164:              }) => <ReelItem item={item} active={index === activeIndex} muted={muted} onToggleMute={() => setMuted(m => !m)} onOpen={() => nav.navigate("ListingDetail", {
mobile/src/screens/ReelsScreen.js:232:    if (!user) { nav.navigate("Login"); return; }
mobile/src/screens/ReelsScreen.js:307:                                if (!user) { nav.navigate("Login"); return; }
mobile/src/screens/ReelsScreen.js:309:                                nav.navigate("Chat", {
mobile/src/screens/SearchScreen.js:229:        // Also save a re-engageable search event (smart notifications).
mobile/src/screens/SellerProfile.js:65:      navigation.navigate("Login");
mobile/src/screens/SellerProfile.js:120:                        <TouchableOpacity onPress={() => navigation.navigate("Chat", {
mobile/src/screens/WalletScreen.js:74:                <TouchableOpacity onPress={() => nav.navigate("Login")} style={styles.signInBtn}>
mobile/src/screens/WalletScreen.js:137:                <TouchableOpacity onPress={() => nav.navigate("MyListings")} style={[styles.quickCard, {
mobile/src/screens/OffersScreen.js:44:        <TouchableOpacity onPress={() => navigation.navigate("ListingDetail", { id: offer.listing_id })} style={s.cardTop}>
mobile/src/socialAuth.js:2:import * as Linking from "expo-linking";
mobile/src/socialAuth.js:14: *   1. Build a deep-link return URL using the app scheme ("harajplus://auth/callback").
mobile/src/socialAuth.js:25:    const returnUrl = Linking.createURL("/auth/callback"); // harajplus://auth/callback
mobile/src/theme.js:8:    primaryHover: "#6DAEE0",   // deeper hover state — used by gradient & pressed.
mobile/src/theme.js:24:    // Text — deep navy on white passes AAA.

## Accessibility and responsive markers
frontend/src/App.js:72:    const { isRTL } = useI18n();
frontend/src/App.js:74:        <div className="min-h-screen bg-[var(--bg)] pb-24" dir={isRTL ? "rtl" : "ltr"}>
frontend/src/components/AIAssistantWidget.js:208:                    aria-label={tr("المساعد الذكي")}
frontend/src/components/AIAssistantWidget.js:221:                    aria-label={tr("إخفاء المساعد")}
frontend/src/components/AIAssistantWidget.js:277:                            <input data-testid="ai-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={tr("اكتب رسالتك...")} className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm font-arabic-body text-[var(--text)] outline-none focus:border-[var(--primary)]" disabled={busy} />
frontend/src/components/AnimalsEquipmentBoxes.js:181:                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body disabled:cursor-not-allowed"
frontend/src/components/AnimalsEquipmentBoxes.js:203:                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body"
frontend/src/components/AnimalsEquipmentBoxes.js:222:                    className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin pe-12"
frontend/src/components/AnimalsEquipmentBoxes.js:243:                    className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin font-bold pe-10"
frontend/src/components/AuctionsServicesBoxes.js:276:                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body disabled:cursor-not-allowed"
frontend/src/components/AuctionsServicesBoxes.js:298:                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body"
frontend/src/components/AuctionsServicesBoxes.js:317:                    className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin pe-10"
frontend/src/components/AuctionsServicesBoxes.js:339:                    className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin font-bold pe-10"
frontend/src/components/AuctionsServicesBoxes.js:356:                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin"
frontend/src/components/AuctionsServicesBoxes.js:373:                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin"
frontend/src/components/AuthCallback.js:98:            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4" dir="rtl" data-testid="auth-callback-error">
frontend/src/components/AuthCallback.js:126:        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]" dir="rtl" data-testid="auth-callback-loading">
frontend/src/components/CategoryCascades.js:204:                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-2 py-2 text-sm text-[var(--text)] font-arabic-body outline-none focus:border-[var(--primary)] disabled:cursor-not-allowed"
frontend/src/components/CategoryCascades.js:224:                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-2 py-2 text-sm text-[var(--text)] font-arabic-body outline-none focus:border-[var(--primary)]"
frontend/src/components/CountryPicker.js:37:            dir="rtl"
frontend/src/components/CountryPicker.js:45:                    aria-label={tr("إغلاق")}
frontend/src/components/GeoAutocomplete.js:97:                className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body"
frontend/src/components/ImageViewer.js:106:            // Right swipe in RTL = previous; Left swipe = next
frontend/src/components/ImageViewer.js:107:            // For both LTR/RTL we use natural: dx>0 means swipe right -> previous image
frontend/src/components/ImageViewer.js:118:            <button data-testid="iv-close" onClick={onClose} aria-label={tr("إغلاق")} className="absolute top-3 end-3 w-14 h-14 rounded-full bg-red-500/95 hover:bg-red-500 shadow-2xl text-white flex items-center justify-center z-[110] border-2 border-white/40"><X className="w-7 h-7" /></button>
frontend/src/components/ImageViewer.js:132:                    {/* Previous (right side in RTL) */}
frontend/src/components/ImageViewer.js:133:                    <button data-testid="iv-prev" onClick={prev} aria-label={tr("السابق")} className="absolute end-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 active:bg-white/40 backdrop-blur text-white flex items-center justify-center shadow-lg z-[105] mt-7"><ChevronRight className="w-6 h-6" /></button>
frontend/src/components/ImageViewer.js:134:                    {/* Next (left side in RTL) */}
frontend/src/components/ImageViewer.js:135:                    <button data-testid="iv-next" onClick={next} aria-label={tr("التالي")} className="absolute start-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 active:bg-white/40 backdrop-blur text-white flex items-center justify-center shadow-lg z-[105] mt-7"><ChevronLeft className="w-6 h-6" /></button>
frontend/src/components/JobsRealEstateBoxes.js:161:                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body"
frontend/src/components/JobsRealEstateBoxes.js:182:                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body"
frontend/src/components/JobsRealEstateBoxes.js:201:                    className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin pe-10"
frontend/src/components/JobsRealEstateBoxes.js:222:                    className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin font-bold pe-10"
frontend/src/components/JobsRealEstateBoxes.js:240:                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body resize-none"
frontend/src/components/NotificationBell.js:40:    const direction = lang === "ar" ? "rtl" : "ltr";
frontend/src/components/NotificationBell.js:116:                aria-label={tr("الإشعارات")}
frontend/src/components/NotificationBell.js:127:                <div data-testid="notif-dropdown" className="absolute top-12 start-1/2 -translate-x-1/2 w-[min(22rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] max-h-[70vh] overflow-hidden bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] z-50 flex flex-col" dir={direction}>
frontend/src/components/SmartAppBanner.js:52:            // If the page is still visible (i.e. the app didn't take focus),
frontend/src/components/SmartAppBanner.js:90:                <button data-testid="app-banner-dismiss" onClick={dismiss} aria-label={tr("إغلاق")} className="shrink-0 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
frontend/src/components/layout/BottomNav.js:63:                aria-label={label}
frontend/src/components/layout/BottomNav.js:98:                aria-label={tr("نشر إعلان")}
frontend/src/components/layout/BottomNav.js:116:            <nav data-testid="bottom-nav-pill" className="fixed left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-1rem)] sm:w-auto" style={{ bottom: "env(safe-area-inset-bottom, 0px)" }} dir="rtl">
frontend/src/components/layout/BottomNav.js:125:                    <div className="w-14 h-1 shrink-0" aria-hidden="true"></div>
frontend/src/components/layout/TopBar.js:151:            <div className="max-w-7xl mx-auto px-2 sm:px-6 py-2 flex flex-nowrap items-center gap-1.5 sm:gap-2" ref={ref} dir="rtl">
frontend/src/components/layout/TopBar.js:158:                    <div className={`flex items-center bg-white/95 dark:bg-[var(--surface)]/90 rounded-full px-2 sm:px-2.5 py-1.5 border border-white/30 dark:border-white/10 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-white transition-all`}>
frontend/src/components/layout/TopBar.js:177:                        {(voiceStatus || imageStatus) && <div className="absolute top-full mt-1 start-0 end-0 z-50 rounded-xl bg-black/85 text-white text-xs px-3 py-2 shadow-lg flex items-center gap-2" role="status" aria-live="polite">{(voicePhase === "listening" || voicePhase === "transcribing" || imagePhase === "processing") && <Loader2 className="inline-block w-3.5 h-3.5 animate-spin shrink-0" />}{imagePreview && imagePhase !== "idle" && <img src={imagePreview} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />}{voiceStatus || imageStatus}</div>}
frontend/src/components/layout/TopBar.js:271:                    <button data-testid="theme-toggle-btn" onClick={() => setOpenMenu(openMenu === "theme" ? null : "theme")} aria-label="Theme" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center border border-white/25 dark:border-white/15 transition-all backdrop-blur">
frontend/src/components/ui/alert.jsx:25:    role="alert"
frontend/src/components/ui/badge.jsx:7:  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
frontend/src/components/ui/breadcrumb.jsx:8:  ({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />
frontend/src/components/ui/breadcrumb.jsx:46:    role="link"
frontend/src/components/ui/breadcrumb.jsx:47:    aria-disabled="true"
frontend/src/components/ui/breadcrumb.jsx:48:    aria-current="page"
frontend/src/components/ui/breadcrumb.jsx:60:    role="presentation"
frontend/src/components/ui/breadcrumb.jsx:61:    aria-hidden="true"
frontend/src/components/ui/breadcrumb.jsx:74:    role="presentation"
frontend/src/components/ui/breadcrumb.jsx:75:    aria-hidden="true"
frontend/src/components/ui/button.jsx:8:  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
frontend/src/components/ui/calendar.jsx:36:          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
frontend/src/components/ui/calendar.jsx:38:            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
frontend/src/components/ui/calendar.jsx:39:            : "[&:has([aria-selected])]:rounded-md"
frontend/src/components/ui/calendar.jsx:43:          "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
frontend/src/components/ui/calendar.jsx:48:          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
frontend/src/components/ui/calendar.jsx:51:          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
frontend/src/components/ui/calendar.jsx:54:          "aria-selected:bg-accent aria-selected:text-accent-foreground",
frontend/src/components/ui/carousel.jsx:105:        role="region"
frontend/src/components/ui/carousel.jsx:106:        aria-roledescription="carousel"
frontend/src/components/ui/carousel.jsx:139:      role="group"
frontend/src/components/ui/carousel.jsx:140:      aria-roledescription="slide"
frontend/src/components/ui/checkbox.jsx:11:      "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
frontend/src/components/ui/context-menu.jsx:23:      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
frontend/src/components/ui/context-menu.jsx:62:      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
frontend/src/components/ui/context-menu.jsx:74:      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
frontend/src/components/ui/context-menu.jsx:94:      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
frontend/src/components/ui/dialog.jsx:38:        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
frontend/src/components/ui/dropdown-menu.jsx:23:      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
frontend/src/components/ui/dropdown-menu.jsx:66:      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
frontend/src/components/ui/dropdown-menu.jsx:78:      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
frontend/src/components/ui/dropdown-menu.jsx:98:      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
frontend/src/components/ui/form.jsx:80:      aria-describedby={
frontend/src/components/ui/form.jsx:85:      aria-invalid={!!error}
frontend/src/components/ui/input-otp.jsx:47:  <div ref={ref} role="separator" {...props}>
frontend/src/components/ui/input.jsx:10:        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
frontend/src/components/ui/menubar.jsx:52:      "flex cursor-default select-none items-center rounded-sm px-3 py-1 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
frontend/src/components/ui/menubar.jsx:63:      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
frontend/src/components/ui/menubar.jsx:108:      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
frontend/src/components/ui/menubar.jsx:120:      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
frontend/src/components/ui/menubar.jsx:139:      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
frontend/src/components/ui/navigation-menu.jsx:36:  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:text-accent-foreground data-[state=open]:bg-accent/50 data-[state=open]:hover:bg-accent data-[state=open]:focus:bg-accent"
frontend/src/components/ui/navigation-menu.jsx:47:      aria-hidden="true" />
frontend/src/components/ui/pagination.jsx:12:    role="navigation"
frontend/src/components/ui/pagination.jsx:13:    aria-label="pagination"
frontend/src/components/ui/pagination.jsx:39:    aria-current={isActive ? "page" : undefined}
frontend/src/components/ui/pagination.jsx:53:    aria-label="Go to previous page"
frontend/src/components/ui/pagination.jsx:68:    aria-label="Go to next page"
frontend/src/components/ui/pagination.jsx:83:    aria-hidden
frontend/src/components/ui/radio-group.jsx:17:        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
frontend/src/components/ui/resizable.jsx:12:      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
frontend/src/components/ui/resizable.jsx:27:      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
frontend/src/components/ui/select.jsx:17:      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
frontend/src/components/ui/select.jsx:86:      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
frontend/src/components/ui/sheet.jsx:51:        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
frontend/src/components/ui/slider.jsx:16:      className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
frontend/src/components/ui/switch.jsx:9:      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
frontend/src/components/ui/table.jsx:51:      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
frontend/src/components/ui/table.jsx:62:      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
frontend/src/components/ui/tabs.jsx:23:      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
frontend/src/components/ui/tabs.jsx:34:      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
frontend/src/components/ui/textarea.jsx:9:        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
frontend/src/components/ui/toast.jsx:51:      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
frontend/src/components/ui/toast.jsx:62:      "absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
frontend/src/components/ui/toggle.jsx:10:  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
frontend/src/components/Model3DViewer.js:14:        <button onClick={onClose} className="absolute top-4 end-4 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center z-10" aria-label={tr("إغلاق")}><X className="w-5 h-5" /></button>
frontend/src/components/VoiceCallModal.js:158:        <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
frontend/src/components/VoiceCallModal.js:166:                    {status === "incoming" && <button onClick={acceptIncoming} className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center" aria-label={tr("قبول") }><Phone className="w-5 h-5" /></button>}
frontend/src/components/VoiceCallModal.js:167:                    {status !== "incoming" && status !== "failed" && <button onClick={toggleMute} className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] text-[var(--text)] flex items-center justify-center" aria-label={muted ? tr("تشغيل الميكروفون") : tr("كتم الميكروفون")}>{muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>}
frontend/src/components/VoiceCallModal.js:168:                    <button onClick={() => cleanup(true)} className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center" aria-label={tr("إنهاء المكالمة")}><PhoneOff className="w-5 h-5" /></button>
frontend/src/contexts/I18nContext.js:239:const RTL_LANGS = ["ar", "ur"];
frontend/src/contexts/I18nContext.js:282:        document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
frontend/src/contexts/I18nContext.js:292:        window.addEventListener("focus", syncDeviceLanguage);
frontend/src/contexts/I18nContext.js:295:            window.removeEventListener("focus", syncDeviceLanguage);
frontend/src/contexts/I18nContext.js:306:    const isRTL = RTL_LANGS.includes(lang);
frontend/src/contexts/I18nContext.js:332:        <I18nCtx.Provider value={{ lang, setLang: chooseLanguage, t, tr, isRTL, pickName, pickLabel, available: ["auto", "ar", "en", "ur", "hi", "bn", "fr"] }}>
frontend/src/index.js:26:      <main dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f1f6fa", color: "#0f172a", fontFamily: "system-ui, sans-serif" }}>
frontend/src/lib/categoryIcons.js:49:    <span className={`category-icon-premium ${className}`} aria-hidden="true">
frontend/src/lib/notificationLinks.js:63:    const focus = type === "comment" || type === "comment_reply" ? "#comments" : "";
frontend/src/lib/notificationLinks.js:64:    return `/listing/${encodeURIComponent(listingId)}${focus}`;
frontend/src/pages/AdminPage.js:1055:                        <input data-testid="notif-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder={tr("🔥 عرض اليوم!")} />
frontend/src/pages/AdminPage.js:1059:                        <textarea data-testid="notif-body" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={500} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder={tr("اكتشف صفقات حصرية على الإعلانات الجديدة!")} />
frontend/src/pages/AdminPage.js:1064:                            <input data-testid="notif-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} maxLength={300} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)] font-latin" placeholder="/listing/abc123  •  /auctions  •  https://..." />
frontend/src/pages/AdminPage.js:1069:                            <input data-testid="notif-image" type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} maxLength={400} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)] font-latin" placeholder="https://res.cloudinary.com/.../image.jpg" />
frontend/src/pages/AdminPage.js:1076:                            <select data-testid="notif-target" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]">
frontend/src/pages/AdminPage.js:1088:                                <input value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} maxLength={2} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder="SA / AE / KW..." />
frontend/src/pages/AdminPage.js:1094:                                <input data-testid="notif-category" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder="cars / electronics ..." />
frontend/src/pages/AdminPage.js:1100:                                <input data-testid="notif-inactive-days" type="number" min="1" max="365" value={form.inactive_days || 14} onChange={(e) => setForm({ ...form, inactive_days: parseInt(e.target.value || "14", 10) })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" />
frontend/src/pages/AdminPage.js:1218:                            <input data-testid="ad-iframe-url-input" required value={form.iframe_url} onChange={(e) => setForm({ ...form, iframe_url: e.target.value })} placeholder={tr("رابط iframe الكامل (https://trip.com/...)")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none ltr-text" dir="ltr" />
frontend/src/pages/AdminPage.js:1363:                    <input data-testid="new-city-en" value={newCity.name_en} onChange={(e) => setNewCity({ ...newCity, name_en: e.target.value })} placeholder={tr("English name (optional)")} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none" dir="ltr" />
frontend/src/pages/AuctionsPage.js:256:                        <input data-testid="bid-amount" type="number" min={minRequired} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`${minRequired}`} className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-3 text-base font-bold text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin" />
frontend/src/pages/Auth.js:124:                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
frontend/src/pages/Auth.js:194:                    <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
frontend/src/pages/Auth.js:295:                    <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
frontend/src/pages/Auth.js:303:                        <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
frontend/src/pages/Auth.js:312:                    <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
frontend/src/pages/Auth.js:414:            <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
frontend/src/pages/Auth.js:485:        <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
frontend/src/pages/CategoryPage.js:125:                    <input data-testid="filter-min-price" type="number" placeholder={tr("السعر من")} value={filters.min_price} onChange={(e) => updateFilter("min_price", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/CategoryPage.js:126:                    <input data-testid="filter-max-price" type="number" placeholder={tr("السعر إلى")} value={filters.max_price} onChange={(e) => updateFilter("max_price", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/CategoryPage.js:127:                    <input data-testid="filter-city" type="text" placeholder={tr("المدينة")} value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/ChatPage.js:91:        // Only react to the "natural reply direction" (RTL: swipe left ≈ -dx, LTR: swipe right ≈ dx).
frontend/src/pages/ChatPage.js:92:        const isRTL = document.dir === "rtl";
frontend/src/pages/ChatPage.js:93:        const triggered = isRTL ? dx < -60 : dx > 60;
frontend/src/pages/ChatPage.js:431:            setTimeout(() => inputRef.current?.focus(), 80);
frontend/src/pages/ChatPage.js:567:        setTimeout(() => inputRef.current?.focus(), 30);
frontend/src/pages/ChatPage.js:729:                                <button onClick={() => { setActiveConvoId(null); setActiveOther(null); }} className="text-[var(--text-muted)] hover:text-[var(--primary)] md:hidden" aria-label={tr("رجوع")}><ChevronRight className="w-5 h-5 rtl:rotate-180" /></button>
frontend/src/pages/ChatPage.js:740:                                <button onClick={() => setStartCall(true)} className="w-9 h-9 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 flex items-center justify-center shrink-0" aria-label={tr("مكالمة صوتية")} data-testid="voice-call-btn">
frontend/src/pages/ChatPage.js:793:                                    <button data-testid="chat-scroll-down" onClick={() => scrollToBottom(true)} className="hp-scroll-down" aria-label={tr("النزول")}>
frontend/src/pages/ChatPage.js:807:                                    <button onClick={() => setReplyTo(null)} className="w-6 h-6 rounded-full hover:bg-[var(--surface)] flex items-center justify-center" aria-label="إلغاء"><X className="w-3.5 h-3.5" /></button>
frontend/src/pages/FlightsPage.js:140:                className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body text-start flex items-center justify-between gap-2"
frontend/src/pages/FlightsPage.js:269:                        <input data-testid="flight-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/FlightsPage.js:274:                            <input data-testid="flight-return" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} min={date || new Date().toISOString().slice(0, 10)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/FlightsPage.js:279:                            <input data-testid="flight-pax" type="number" min={1} max={9} value={pax} onChange={(e) => setPax(parseInt(e.target.value) || 1)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/FlightsPage.js:286:                        <input data-testid="flight-pax" type="number" min={1} max={9} value={pax} onChange={(e) => setPax(parseInt(e.target.value) || 1)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/ListingDetail.js:412:                                <input data-testid="listing-comment-input" value={commentText} onChange={(e) => setCommentText(e.target.value)} maxLength={1000} placeholder={tr("اكتب تعليقًا عامًا...")} className="flex-1 min-w-0 bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/ListingDetail.js:642:                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={tr("قدم عرض سعر")}>
frontend/src/pages/ListingDetail.js:646:                            <button type="button" onClick={() => setShowOffer(false)} className="text-[var(--text-muted)] text-xl" aria-label={tr("إغلاق")}>×</button>
frontend/src/pages/ListingDetail.js:649:                        <input autoFocus required type="number" min="1" step="0.01" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-3 border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] mb-3" placeholder={listing.price ? String(listing.price) : "0"} />
frontend/src/pages/ListingDetail.js:651:                        <textarea rows={3} value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-3 border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] mb-4" placeholder={tr("اكتب رسالة للبائع...")} />
frontend/src/pages/PostListing.js:685:                        <input data-testid="post-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={tr("مثال: تويوتا كامري 2020 — وارد الخليج")} />
frontend/src/pages/PostListing.js:698:                                className="w-full appearance-none bg-[var(--surface-elevated)] rounded-xl px-3 py-3 pr-10 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body cursor-pointer"
frontend/src/pages/PostListing.js:731:                        <textarea data-testid="post-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={tr("اكتب وصفاً تفصيلياً...")} />
frontend/src/pages/PostListing.js:806:                                    <input data-testid="post-price" type="number" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl ps-4 pe-16 py-3 text-base border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin font-bold tracking-wider" placeholder={tr("اتركه فارغاً للسوم")} style={{ minHeight: "48px" }} />
frontend/src/pages/PostListing.js:840:                                <select data-testid={`field-${f.key}`} value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body">
frontend/src/pages/PostListing.js:848:                                <input data-testid={`field-${f.key}`} type={f.type} value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={f.placeholder || ""} />
frontend/src/pages/PostListing.js:850:                                <input data-testid={`field-${f.key}`} value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={f.placeholder || ""} />
frontend/src/pages/PostListing.js:1038:                                        {accountPhone && <div className="text-[10px] font-normal opacity-80 mt-0.5" dir="ltr">{accountPhone}</div>}
frontend/src/pages/PostListing.js:1059:                                            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-s-xl px-2 py-3 text-sm font-arabic-body cursor-pointer outline-none focus:border-[var(--primary)]"
frontend/src/pages/PostListing.js:1060:                                            dir="ltr"
frontend/src/pages/PostListing.js:1070:                                            dir="ltr"
frontend/src/pages/PostListing.js:1077:                                            className="flex-1 px-4 py-3 rounded-e-xl bg-[var(--surface-elevated)] border border-s-0 border-[var(--border)] font-arabic-body text-sm outline-none focus:border-[var(--primary)]"
frontend/src/pages/ReelsPage.js:78:            <button data-testid="reels-back-btn" onClick={() => nav(-1)} aria-label={tr("رجوع")} className="absolute top-3 start-3 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur flex items-center justify-center text-white">
frontend/src/pages/ReelsPage.js:81:            <Link to="/post?video=1" data-testid="reels-upload-btn" aria-label={tr("ارفع ستوري فيديو")} className="absolute top-3 end-3 z-30 flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-2 rounded-full shadow-lg hover:scale-105 transition-transform">
frontend/src/pages/SearchAndMap.js:184:                <div className="flex items-center bg-[var(--surface-elevated)] rounded-full px-4 py-2.5 border border-[var(--border)] focus-within:border-[var(--primary)]">
frontend/src/pages/SearchAndMap.js:213:                            <input data-testid="filter-min" type="number" placeholder={tr("السعر من")} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/SearchAndMap.js:214:                            <input data-testid="filter-max" type="number" placeholder={tr("السعر إلى")} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/SnapAuthCallback.js:35:        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]" dir="rtl">
frontend/src/pages/StaticPages.js:165:                    <input data-testid="contact-subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={tr("الموضوع")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/StaticPages.js:166:                    <textarea data-testid="contact-message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={tr("اكتب رسالتك...")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]"></textarea>
frontend/src/pages/XAuthCallback.js:35:        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]" dir="rtl">
frontend/src/pages/SellerStorefrontPage.js:24:        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5" dir="rtl" data-testid="seller-storefront-page">
frontend/src/pages/NotificationsPage.js:17:    const direction = lang === "ar" ? "rtl" : "ltr";
frontend/src/pages/NotificationsPage.js:25:    return <main className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-6 pb-24 overflow-x-hidden" dir={direction} data-testid="notifications-page"><div className="flex items-center justify-between mb-5"><div><h1 className="font-arabic font-black text-2xl text-[var(--text)] flex items-center gap-2"><Bell className="w-6 h-6 text-[var(--primary)]" />{tr("الإشعارات")}</h1><p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{tr("رسائل فورية، عروض، تحديثات الإعلانات والتنبيهات المهمة")}</p></div>{items.some((n) => !n.read) && <button onClick={markAll} className="px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-arabic font-bold flex items-center gap-1"><CheckCheck className="w-4 h-4" />{tr("تعليم الكل كمقروء")}</button>}</div>{loading ? <div className="py-16 text-center text-[var(--text-muted)] font-arabic-body">{tr("جاري التحميل...")}</div> : items.length === 0 ? <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center text-[var(--text-muted)] font-arabic-body"><Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />{tr("لا توجد إشعارات بعد")}</div> : <div className="w-full max-w-2xl mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">{items.map((n) => { const Icon = ICONS[n.type] || Bell; return <Link key={n.id} to={notificationUrl(n)} onClick={() => !n.read && markOne(n.id)} className={`flex gap-3 p-4 min-w-0 overflow-hidden border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-elevated)] ${!n.read ? "bg-[var(--primary)]/5" : ""}`}><div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center shrink-0 text-[var(--primary)]"><Icon className="w-5 h-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2 min-w-0"><h2 className="font-arabic font-bold text-sm text-[var(--text)] truncate min-w-0">{n.title}</h2>{!n.read && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}</div>{n.body && <p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{n.body}</p>}<time className="block text-[10px] text-[var(--text-muted)] mt-2">{new Date(n.created_at || n.ts).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}</time></div>{!n.read && <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />}</Link>; })}</div>}</main>;
frontend/src/pages/AccountCollectionPage.js:69:        <button onClick={load} disabled={busy} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] disabled:opacity-50" aria-label={t("تحديث")}><RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /></button>
frontend/src/pages/AccountCollectionPage.js:81:      {!busy && otherRows.length > 0 && <div className="space-y-3 mt-2">{otherRows.map((row, index) => <div key={row.id || row.search_id || row.user_id || index} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between gap-3"><div className="min-w-0"><p className="font-arabic font-bold text-[var(--text)] truncate">{row.name || row.title || row.query || row.keyword || t("عنصر محفوظ")}</p><p className="text-xs text-[var(--text-muted)] font-arabic-body truncate">{row.description || row.city || row.country_code || row.status || ""}</p></div>{(row.listing_id || row.id) && config.key === "offers" && <Link to={`/listing/${row.listing_id || row.id}`} className="shrink-0 p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]" aria-label={t("فتح الإعلان")}><ExternalLink className="w-4 h-4" /></Link>}</div>)}</div>}
mobile/src/I18nContext.js:2305:                // Make sure the layout direction matches the persisted language
mobile/src/I18nContext.js:2307:                const wantRTL = (initial === "ar" || initial === "ur");
mobile/src/I18nContext.js:2309:                    if (I18nManager.isRTL !== wantRTL) {
mobile/src/I18nContext.js:2310:                        I18nManager.allowRTL(wantRTL);
mobile/src/I18nContext.js:2311:                        I18nManager.forceRTL(wantRTL);
mobile/src/I18nContext.js:2325:            const wantRTL = (l === "ar" || l === "ur");
mobile/src/I18nContext.js:2326:            if (I18nManager.isRTL !== wantRTL) {
mobile/src/I18nContext.js:2327:                I18nManager.allowRTL(wantRTL);
mobile/src/I18nContext.js:2328:                I18nManager.forceRTL(wantRTL);
mobile/src/I18nContext.js:2329:                // RN requires a JS-bundle reload for the new direction to take
mobile/src/I18nContext.js:2353:            re-render with the new translations + RTL/LTR direction without
mobile/src/components/AIAssistantFab.js:11:import { Animated, Dimensions, PanResponder, StyleSheet, TouchableOpacity, View, Text } from "react-native";
mobile/src/components/AIAssistantFab.js:41:    const { width: W, height: H } = Dimensions.get("window");
mobile/src/components/FloatingTabBar.js:11:import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, I18nManager, Dimensions } from "react-native";
mobile/src/components/FloatingTabBar.js:13:import { useSafeAreaInsets } from "react-native-safe-area-context";
mobile/src/components/FloatingTabBar.js:21:// ---- Dimensions (revision 4 — owner spec Feb 2026) ----
mobile/src/components/FloatingTabBar.js:68:  const insets = useSafeAreaInsets();
mobile/src/components/FloatingTabBar.js:92:  const TABS_LTR = [
mobile/src/components/FloatingTabBar.js:99:  const TABS = I18nManager.isRTL ? [...TABS_LTR].reverse() : TABS_LTR;
mobile/src/components/FloatingTabBar.js:118:  const W = Dimensions.get("window").width;
mobile/src/components/FloatingTabBar.js:149:            accessibilityLabel={t("أضف إعلان")}
mobile/src/components/FloatingTabBar.js:170:            const focused = state.index === routeIndex;
mobile/src/components/FloatingTabBar.js:174:              if (!focused && !ev.defaultPrevented) navigation.navigate(tab.name);
mobile/src/components/FloatingTabBar.js:184:                accessibilityState={{ selected: focused }}
mobile/src/components/FloatingTabBar.js:186:                <Icon size={18} color={focused ? activeColor : inactiveColor} strokeWidth={focused ? 2.6 : 2} />
mobile/src/components/FloatingTabBar.js:187:                <Text style={[styles.tabLabel, { color: focused ? activeColor : inactiveColor, fontWeight: focused ? "900" : "700" }]} numberOfLines={1}>
mobile/src/components/NotificationBell.js:3:// focus so the badge stays fresh without a websocket.
mobile/src/components/Skeleton.js:4:import { Animated, View, StyleSheet, Dimensions, Easing } from "react-native";
mobile/src/components/Skeleton.js:7:const W = Dimensions.get("window").width;
mobile/src/components/StandaloneFloatingTabBar.js:4:import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, I18nManager, Dimensions } from "react-native";
mobile/src/components/StandaloneFloatingTabBar.js:6:import { useSafeAreaInsets } from "react-native-safe-area-context";
mobile/src/components/StandaloneFloatingTabBar.js:15:// ---- Dimensions (revision 3 — owner spec Feb 2026) ----
mobile/src/components/StandaloneFloatingTabBar.js:39:  const insets = useSafeAreaInsets();
mobile/src/components/StandaloneFloatingTabBar.js:61:  const TABS_LTR = [
mobile/src/components/StandaloneFloatingTabBar.js:68:  const TABS = I18nManager.isRTL ? [...TABS_LTR].reverse() : TABS_LTR;
mobile/src/components/StandaloneFloatingTabBar.js:83:  const W = Dimensions.get("window").width;
mobile/src/components/StandaloneFloatingTabBar.js:102:            accessibilityLabel={t("أضف إعلان")}
mobile/src/components/StandaloneFloatingTabBar.js:117:            const focused = activeKey === tab.key;
mobile/src/components/StandaloneFloatingTabBar.js:124:                style={[styles.tabBtn, focused && { backgroundColor: palette.primaryHover || palette.primary, borderColor: palette.primaryFg, borderWidth: 1, shadowColor: palette.primary, shadowOpacity: 0.24, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }]}
mobile/src/components/StandaloneFloatingTabBar.js:127:                <Icon size={18} color={focused ? activeColor : inactiveColor} strokeWidth={focused ? 2.6 : 2} />
mobile/src/components/StandaloneFloatingTabBar.js:128:                <Text style={[styles.tabLabel, { color: focused ? activeColor : inactiveColor, fontWeight: focused ? "900" : "700" }]} numberOfLines={1}>
mobile/src/components/VoiceCallWebView.js:41:  const url = `https://www.alhraj.online/voice-call.html?role=${encodeURIComponent(role)}&to=${encodeURIComponent(to || "")}&convo=${encodeURIComponent(convoId || "")}&callId=${encodeURIComponent(callId || `call_${Date.now()}`)}&name=${encodeURIComponent(name || "Haraj Plus")}`;
mobile/src/notifications.js:70:        const isComments = /(?:#comments|[?&](?:focus|section)=comments)/i.test(url);
mobile/src/notifications.js:71:        _navigationRef.navigate("ListingDetail", { id: m[1], focus: isComments ? "comments" : undefined });
mobile/src/screens/AuctionsScreen.js:5:import { useSafeAreaInsets } from "react-native-safe-area-context";
mobile/src/screens/AuctionsScreen.js:19:  const insets = useSafeAreaInsets();
mobile/src/screens/AuctionsScreen.js:197:  const insets = useSafeAreaInsets();
mobile/src/screens/AuthScreens.js:44:      {/* RIGHT side (RTL: end) — back to Home */}
mobile/src/screens/ChatScreen.js:10:import { useSafeAreaInsets } from "react-native-safe-area-context";
mobile/src/screens/ChatScreen.js:117:  const insets = useSafeAreaInsets();
mobile/src/screens/ChatScreen.js:354:  const insets = useSafeAreaInsets();
mobile/src/screens/ChatScreen.js:1067:            <VoiceCallWebView visible={voiceCallVisible} role={incomingCall ? "receiver" : "caller"} to={incomingCall?.from || other.id} convoId={convoId} callId={incomingCall?.call_id} signalingEvent={incomingCall?.type === "call_offer" ? incomingCall : null} name={other.name} onClose={() => { setVoiceCallVisible(false); setIncomingCall(null); }} />
mobile/src/screens/ChatScreen.js:1127:  // natural reading direction (RTL → swipe LEFT, LTR → swipe RIGHT) triggers
mobile/src/screens/HomeScreen.js:3:import { View, Text, ScrollView, TouchableOpacity, FlatList, Image, StyleSheet, RefreshControl, ActivityIndicator, Dimensions, StatusBar } from "react-native";
mobile/src/screens/HomeScreen.js:6:import { useSafeAreaInsets } from "react-native-safe-area-context";
mobile/src/screens/HomeScreen.js:24:} = Dimensions.get("window");
mobile/src/screens/HomeScreen.js:30:  const insets = useSafeAreaInsets();
mobile/src/screens/HomeScreen.js:252:                  accessibilityLabel={t("بحث بالصورة")}
mobile/src/screens/ListingDetailScreen.js:2:import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert, Share, FlatList, Dimensions, Modal, TextInput, PanResponder } from "react-native";
mobile/src/screens/ListingDetailScreen.js:5:import { useSafeAreaInsets } from "react-native-safe-area-context";
mobile/src/screens/ListingDetailScreen.js:26:  const insets = useSafeAreaInsets();
mobile/src/screens/ListingDetailScreen.js:61:  const SCREEN_W = Dimensions.get("window").width;
mobile/src/screens/ListingDetailScreen.js:94:    if (route.params?.focus !== "comments" || commentsY == null || !listing) return;
mobile/src/screens/ListingDetailScreen.js:97:  }, [route.params?.focus, commentsY, listing]);
mobile/src/screens/ListingDetailScreen.js:284:        {/* Floating back button — top-end (RTL: right). High-contrast pill so
mobile/src/screens/MapScreen.js:2:import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, TextInput } from "react-native";
mobile/src/screens/MapScreen.js:75:  return <SafeAreaView style={styles.wrap}>
mobile/src/screens/MapScreen.js:101:        </SafeAreaView>;
mobile/src/screens/MapScreen.js:128:<html dir="rtl" lang="ar">
mobile/src/screens/MapScreen.js:296:    direction: "rtl"
mobile/src/screens/OtherScreens.js:2:import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
mobile/src/screens/OtherScreens.js:65:  return <SafeAreaView style={[styles.wrap, { backgroundColor: palette.bg }]}>
mobile/src/screens/OtherScreens.js:71:        </SafeAreaView>;
mobile/src/screens/OtherScreens.js:127:  return <SafeAreaView style={[styles.wrap, { backgroundColor: palette.bg }]}>
mobile/src/screens/OtherScreens.js:138:        </SafeAreaView>;
mobile/src/screens/OtherScreens.js:182:  return <SafeAreaView style={[styles.wrap, { backgroundColor: palette.bg }]}>
mobile/src/screens/OtherScreens.js:196:        </SafeAreaView>;
mobile/src/screens/PostScreen.js:7:import { useSafeAreaInsets } from "react-native-safe-area-context";
mobile/src/screens/PostScreen.js:38:  const insets = useSafeAreaInsets();
mobile/src/screens/ProfileScreen.js:8:import { useSafeAreaInsets } from "react-native-safe-area-context";
mobile/src/screens/ProfileScreen.js:27:  const insets = useSafeAreaInsets();
mobile/src/screens/ReelsScreen.js:2:import { View, Text, FlatList, StyleSheet, Dimensions, Image, TouchableOpacity, ActivityIndicator, Share, Alert, StatusBar, PanResponder } from "react-native";
mobile/src/screens/ReelsScreen.js:14:} = Dimensions.get("window");
mobile/src/screens/ReelsScreen.js:15:// Full-screen reels — bottom nav is hidden while this screen is focused, so
mobile/src/screens/ReelsScreen.js:33:  // need for runtime focus-effect hacks here. Reels screen is full-immersive.
mobile/src/screens/ReelsScreen.js:140:              accessibilityLabel={t("خروج")}
mobile/src/screens/ReelsScreen.js:180:  // When the Reels screen is unfocused (user switched tab / pressed X /
mobile/src/screens/ReelsScreen.js:200:    // PAUSE if any of: screen unfocused, reel not active, user paused.
mobile/src/screens/SearchScreen.js:4:import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal, StatusBar, Dimensions, RefreshControl, Alert } from "react-native";
mobile/src/screens/SearchScreen.js:6:import { useSafeAreaInsets } from "react-native-safe-area-context";
mobile/src/screens/SearchScreen.js:24:} = Dimensions.get("window");
mobile/src/screens/SearchScreen.js:47:  const insets = useSafeAreaInsets();
mobile/src/screens/WorkflowScreens.js:2:import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
mobile/src/screens/WorkflowScreens.js:27:  return <SafeAreaView style={[s.root, { backgroundColor: palette.bg }]}><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><FlatList data={rows} keyExtractor={(x) => String(x.id)} refreshing={loading} onRefresh={load} contentContainerStyle={s.content} ListHeaderComponent={<View><Text style={[s.title, { color: palette.text }]}>{t(buy ? "طلبات الشراء" : "الدعم والمساعدة")}</Text><Text style={[s.caption, { color: palette.muted }]}>{t(buy ? "اطلب منتجًا أو خدمة في الدولة المختارة" : "أنشئ تذكرة وتابع حالتها")}</Text>{buy ? <><Field value={form.title} onChangeText={(v) => set("title", v)} placeholder={t("عنوان الطلب")} /><Field value={form.category} onChangeText={(v) => set("category", v)} placeholder={t("الفئة")} /><Field value={form.city} onChangeText={(v) => set("city", v)} placeholder={t("المدينة")} /><View style={s.row}><Field value={form.budget_min} onChangeText={(v) => set("budget_min", v)} placeholder={t("الميزانية من")} keyboardType="numeric" /><Field value={form.budget_max} onChangeText={(v) => set("budget_max", v)} placeholder={t("الميزانية إلى")} keyboardType="numeric" /></View><Field value={form.description} onChangeText={(v) => set("description", v)} placeholder={t("وصف الطلب")} multiline /></> : <><Field value={form.subject} onChangeText={(v) => set("subject", v)} placeholder={t("موضوع التذكرة")} /><Field value={form.message} onChangeText={(v) => set("message", v)} placeholder={t("اكتب رسالتك")} multiline /></>}<TouchableOpacity disabled={busy} onPress={submit} style={[s.button, { backgroundColor: palette.primary }]}><Text style={s.buttonText}>{busy ? t("جاري الحفظ...") : t(buy ? "نشر طلب الشراء" : "إرسال التذكرة")}</Text></TouchableOpacity>{notice ? <Text style={[s.notice, { color: palette.text }]}>{notice}</Text> : null}<Text style={[s.section, { color: palette.text }]}>{t("السجلات السابقة")}</Text></View>} renderItem={({ item }) => <View style={[s.card, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={s.cardHeader}><Text style={[s.cardTitle, { color: palette.text }]}>{item.title || item.subject}</Text><Text style={[s.status, { color: palette.primary }]}>{item.status}</Text></View><Text style={[s.cardBody, { color: palette.muted }]}>{item.description || item.message}</Text></View>} ListEmptyComponent={!loading ? <Text style={[s.empty, { color: palette.muted }]}>{t("لا توجد بيانات بعد")}</Text> : <ActivityIndicator color={palette.primary} />} /></KeyboardAvoidingView></SafeAreaView>;
