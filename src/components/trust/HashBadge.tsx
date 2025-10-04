'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Hash, ExternalLink, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HashBadgeProps {
  hash: string;
  href?: string;
  showIcon?: boolean;
  copyable?: boolean;
}

export function HashBadge({ 
  hash, 
  href, 
  showIcon = true, 
  copyable = true 
}: HashBadgeProps) {
  const [copied, setCopied] = React.useState(false);
  
  const shortHash = hash.length > 12 
    ? `${hash.slice(0, 6)}...${hash.slice(-6)}`
    : hash;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy hash:', error);
    }
  };

  const badgeContent = (
    <Badge 
      variant="outline" 
      className="font-mono text-xs hover:bg-muted/80 transition-colors group"
    >
      <div className="flex items-center gap-1">
        {showIcon && <Hash className="h-3 w-3" />}
        <span className="select-all">{shortHash}</span>
        
        {copyable && (
          <button
            onClick={handleCopy}
            className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
            title="Copiar hash completo"
            aria-label="Copiar hash completo"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        )}
        
        {href && (
          <ExternalLink className="h-3 w-3 ml-1 opacity-60" />
        )}
      </div>
    </Badge>
  );

  if (href) {
    return (
      <Link 
        href={href}
        className="inline-flex items-center hover:opacity-80 transition-opacity"
        title={`Ver auditoria: ${hash}`}
      >
        {badgeContent}
      </Link>
    );
  }

  return (
    <div 
      className="inline-flex items-center cursor-default" 
      title={`Hash: ${hash}`}
    >
      {badgeContent}
    </div>
  );
}
