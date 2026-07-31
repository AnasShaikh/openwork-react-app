import React from "react";
import './Warning.css';

const DEFAULT_ICONS = {
    error: "/triangle_warning.svg",
    info: "/info.svg",
    success: "/assets/check-icon.svg",
    warning: "/orange-warning.svg",
};

export default function Warning({content, icon, variant="warning"}) {
    const resolvedVariant = DEFAULT_ICONS[variant] ? variant : "warning";

    return (
        <div
            className={`warning-content warning-content--${resolvedVariant}`}
            role={resolvedVariant === "error" ? "alert" : "status"}
            aria-live={resolvedVariant === "error" ? "assertive" : "polite"}
        >
            <img src={icon || DEFAULT_ICONS[resolvedVariant]} alt="" />
            <span>{content}</span>
        </div>
    )
}
