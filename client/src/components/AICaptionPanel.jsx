import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Copy, Check, RefreshCw, ChevronDown, ChevronUp,
    Hash, Tag, Lightbulb, Globe, Edit3, Save, X, Star, Zap,
    MessageSquare, Feather, Briefcase, Drama, TrendingUp, Info, UserCheck
} from 'lucide-react';

// ─── Language options ──────────────────────────────────────────────────────────
const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'fr', label: 'French' },
    { code: 'es', label: 'Spanish' },
    { code: 'de', label: 'German' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ar', label: 'Arabic' },
    { code: 'pt', label: 'Portuguese' },
];

const CAPTION_STYLES = [
    { key: 'short',        label: 'Short',        icon: Zap,          color: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200',   desc: 'Social-media punchy' },
    { key: 'creative',     label: 'Creative',     icon: Feather,      color: 'text-purple-500',  bg: 'bg-purple-50',  border: 'border-purple-200',  desc: 'Poetic & storytelling' },
    { key: 'professional', label: 'Professional', icon: Briefcase,    color: 'text-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200',    desc: 'Clean & descriptive' },
    { key: 'dramatic',     label: 'Dramatic',     icon: Drama,        color: 'text-rose-500',    bg: 'bg-rose-50',    border: 'border-rose-200',    desc: 'Bold & cinematic' },
];

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] rounded-lg ${className}`}
        style={{ animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }}
    />
);

const CopyButton = ({ text, label = 'Copy', className = '' }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };
    return (
        <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                copied
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-textSecondary hover:text-textMain'
            } ${className}`}
        >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : label}
        </button>
    );
};

// ─── Score Pill ────────────────────────────────────────────────────────────────
const ScorePill = ({ score, reason }) => {
    const getColor = (s) => {
        if (s >= 90) return 'bg-green-100 text-green-700 border-green-200';
        if (s >= 70) return 'bg-blue-100 text-blue-700 border-blue-200';
        return 'bg-amber-100 text-amber-700 border-amber-200';
    };
    return (
        <div className="group relative">
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black border ${getColor(score)}`}>
                <TrendingUp className="w-2 h-2" />
                {score}%
            </div>
            {reason && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {reason}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
};

const AICaptionPanel = ({ image, onCaptionsUpdate }) => {
    const [captions, setCaptions]           = useState(image?.aiCaptions || null);
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState('');
    const [activeStyle, setActiveStyle]     = useState(null);
    const [showHashtags, setShowHashtags]   = useState(false);
    const [showKeywords, setShowKeywords]   = useState(true);
    const [language, setLanguage]           = useState('en');
    const [editingStyle, setEditingStyle]   = useState(null);
    const [editValue, setEditValue]         = useState('');
    const [savingEdit, setSavingEdit]       = useState(false);
    const [showLangPicker, setShowLangPicker] = useState(false);

    useEffect(() => {
        if (image?.aiCaptions) {
            setCaptions(image.aiCaptions);
            setActiveStyle(image.aiCaptions.recommended || 'creative');
        }
    }, [image?._id, image?.aiCaptions]);

    useEffect(() => {
        if (captions && !activeStyle) {
            setActiveStyle(captions.recommended || 'creative');
        }
    }, [captions, activeStyle]);

    const handleGenerate = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.post(`/media/${image._id}/captions`, { language });
            const data = res.data.data;
            setCaptions(data);
            setActiveStyle(data.recommended || 'creative');
            if (onCaptionsUpdate) onCaptionsUpdate(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate captions. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [image._id, language, onCaptionsUpdate]);

    const handleSaveEdit = async () => {
        if (!editingStyle || !editValue.trim()) { setEditingStyle(null); return; }
        setSavingEdit(true);
        try {
            const body = { [editingStyle]: editValue.trim() };
            const res = await api.put(`/media/${image._id}/captions`, body);
            const updated = { ...captions, ...res.data.data };
            setCaptions(updated);
            if (onCaptionsUpdate) onCaptionsUpdate(updated);
        } catch { /* silent */ } finally {
            setSavingEdit(false);
            setEditingStyle(null);
        }
    };

    const handleRemoveKeyword = async (kw) => {
        const updated = { ...captions, keywords: captions.keywords.filter(k => k.term !== kw) };
        setCaptions(updated);
        try {
            await api.put(`/media/${image._id}/captions`, { keywords: updated.keywords });
            if (onCaptionsUpdate) onCaptionsUpdate(updated);
        } catch { /* silent */ }
    };

    const handleRemoveHashtag = async (ht) => {
        const updated = { ...captions, hashtags: captions.hashtags.filter(h => h.term !== ht) };
        setCaptions(updated);
        try {
            await api.put(`/media/${image._id}/captions`, { hashtags: updated.hashtags });
            if (onCaptionsUpdate) onCaptionsUpdate(updated);
        } catch { /* silent */ }
    };

    if (!captions && !loading) {
        return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-5 border border-violet-100 shadow-sm" >
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"> <Sparkles className="w-4 h-4 text-violet-600" /> </div>
                    <div>
                        <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest leading-none mb-0.5">Smart AI Content Engine</p>
                        <p className="text-xs font-semibold text-textMain">Personalized, SEO-optimized captions</p>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-[9px] font-black text-textSecondary uppercase tracking-widest mb-1.5">Output Language</label>
                    <div className="relative">
                        <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-violet-400" />
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full pl-7 pr-3 py-2 text-xs font-bold bg-white border border-violet-200 rounded-lg outline-none focus:border-violet-400 appearance-none cursor-pointer" >
                            {LANGUAGES.map(l => ( <option key={l.code} value={l.code}>{l.label}</option> ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    {CAPTION_STYLES.map(s => (
                        <div key={s.key} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg ${s.bg} border ${s.border}`}>
                            <s.icon className={`w-3 h-3 ${s.color}`} />
                            <span className={`text-[10px] font-bold ${s.color}`}>{s.label}</span>
                        </div>
                    ))}
                </div>

                <button onClick={handleGenerate} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-black text-xs rounded-xl shadow-lg shadow-violet-200 transition-all active:scale-[0.98] hover:-translate-y-0.5" >
                    <Sparkles className="w-3.5 h-3.5" /> Optimize & Generate
                </button>
            </motion.div>
        );
    }

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-5 border border-violet-100">
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"> <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" /> </div>
                    <div>
                        <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Optimizing metadata…</p>
                        <p className="text-xs text-textSecondary mt-0.5 font-medium">Applying personalization & SEO ranking</p>
                    </div>
                </div>
                <div className="space-y-2"> <Skeleton className="h-8 w-full" /> <Skeleton className="h-16 w-full" /> </div>
            </div>
        );
    }

    const activeCaption = captions?.[activeStyle] || '';
    const activeConfig = CAPTION_STYLES.find(s => s.key === activeStyle);

    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl overflow-hidden border border-borderColor shadow-sm" >
            <div className="px-5 pt-5 pb-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"> <Sparkles className="w-4 h-4 text-violet-600" /> </div>
                        <div>
                            <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest leading-none mb-0.5">Smart AI Content Engine</p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-violet-100 text-violet-600 text-[9px] font-black rounded-full uppercase tracking-wider">{captions.sceneType}</span>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[9px] font-black rounded-full capitalize">{captions.mood}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleGenerate} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-violet-200 hover:border-violet-400 rounded-lg text-[9px] font-black text-violet-500 uppercase tracking-widest transition-all">
                        <RefreshCw className="w-3 h-3" /> Re-Optimize
                    </button>
                </div>
                {captions.personalizationNotes && (
                    <div className="mt-3 flex items-start gap-2 p-2 bg-white/50 rounded-lg border border-violet-100/50">
                        <UserCheck className="w-3 h-3 text-violet-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[9px] font-semibold text-violet-700 leading-tight">
                            Personalized: {captions.personalizationNotes}
                        </p>
                    </div>
                )}
            </div>

            <div className="p-5 space-y-4">
                <div className="grid grid-cols-4 gap-1.5">
                    {CAPTION_STYLES.map(style => (
                        <button key={style.key} onClick={() => setActiveStyle(style.key)} className={`relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all ${ activeStyle === style.key ? `${style.bg} ${style.border} ${style.color}` : 'bg-gray-50 border-gray-100 text-textSecondary hover:bg-gray-100' }`} >
                            {captions.recommended === style.key && ( <Star className={`absolute -top-1.5 -right-1.5 w-3 h-3 fill-current ${activeStyle === style.key ? style.color : 'text-amber-400'}`} /> )}
                            <style.icon className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-wider leading-none">{style.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeConfig && (
                        <motion.div key={activeStyle} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className={`rounded-xl p-4 border ${activeConfig.bg} ${activeConfig.border} relative group`} >
                            <p className={`text-[9px] font-black uppercase tracking-widest ${activeConfig.color} mb-2 flex items-center gap-1`}>
                                <activeConfig.icon className="w-3 h-3" /> {activeConfig.desc}
                            </p>
                            {editingStyle === activeStyle ? (
                                <div className="space-y-2">
                                    <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={3} className="w-full text-sm font-medium text-textMain bg-white rounded-lg p-2.5 border border-gray-200 resize-none outline-none focus:border-violet-400" />
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveEdit} disabled={savingEdit} className="bg-violet-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black" > {savingEdit ? 'Saving…' : 'Save'} </button>
                                        <button onClick={() => setEditingStyle(null)} className="bg-gray-100 text-textSecondary px-3 py-1.5 rounded-lg text-[10px] font-black" > Cancel </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-textMain leading-relaxed">{activeCaption}</p>
                                    <button onClick={() => { setEditingStyle(activeStyle); setEditValue(activeCaption); }} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-textSecondary hover:text-violet-500" > <Edit3 className="w-3 h-3" /> </button>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2">
                    <CopyButton text={activeCaption} label="Copy Caption" className="flex-1 justify-center py-2" />
                    <CopyButton text={captions.hashtags?.map(h => h.term).join(' ')} label="Hashtags" className="justify-center py-2" />
                </div>

                <div className="border-t border-gray-50 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-textSecondary">Ranked Keywords</span>
                        </div>
                        <CopyButton text={captions.keywords?.map(k => k.term).join(', ')} label="Copy All" className="py-1 text-[9px]" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {captions.keywords?.map((kw, i) => (
                            <div key={i} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold rounded-full group/kw" >
                                {kw.term}
                                <ScorePill score={kw.score} reason={kw.reason} />
                                <button onClick={() => handleRemoveKeyword(kw.term)} className="opacity-0 group-hover/kw:opacity-100 transition-opacity ml-1 text-blue-300 hover:text-red-500" > <X className="w-2.5 h-2.5" /> </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-50 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-pink-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-textSecondary">Engagement Ranking</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {captions.hashtags?.map((ht, i) => (
                            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-pink-50 border border-pink-100 text-pink-600 text-[10px] font-bold rounded-full group/ht" >
                                {ht.term}
                                <div className={`px-1 rounded text-[7px] font-black uppercase ${ht.engagement === 'high' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {ht.engagement}
                                </div>
                                <button onClick={() => handleRemoveHashtag(ht.term)} className="opacity-0 group-hover/ht:opacity-100 transition-opacity text-pink-300 hover:text-red-500" > <X className="w-2.5 h-2.5" /> </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AICaptionPanel;
