import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search clips...", className }: SearchInputProps) {
    return (
        <div className={cn("relative group w-full max-w-md transition-all duration-300", className)}>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className={cn(
                    "w-4 h-4 transition-colors duration-200",
                    value ? "text-primary" : "text-muted-foreground group-focus-within:text-primary"
                )} />
            </div>
            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "pl-9 pr-10 h-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 rounded-xl",
                    "placeholder:text-muted-foreground/50 text-sm"
                )}
            />
            {value && (
                <div className="absolute inset-y-0 right-1 flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onChange("")}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>
            )}
        </div>
    );
}
