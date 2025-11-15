import React from 'react';
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppState, type Lang } from "@/hooks/store"


export const Language = () => {
    const { t, i18n } = useTranslation();  
    const { language } = useAppState();

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'Français' },
    ];

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        useAppState.getState().setLanguage(lang as Lang);
    };

    useEffect(() => {
        if (i18n.language !== language) {
          i18n.changeLanguage(language);
        }
      }, [language, i18n]);

    return (
        <div className="w-full">
            
            <Card>
                <CardHeader>
                    <CardTitle>Select Language</CardTitle>
                    <CardDescription>Choose your preferred language for the interface</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium">Current Language:</label>
                            <Select value={i18n.language} onValueChange={handleLanguageChange}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {languages.map((lang) => (
                                        <SelectItem key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="mt-4 p-4 bg-muted rounded-md">
                            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                            <p className="font-medium">{t('Welcome to React')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}; 