import React from "react";
import Header from "./header";

export function Layout({ children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
            <Header>
            </Header>
            {children}
        </div>
    )
}