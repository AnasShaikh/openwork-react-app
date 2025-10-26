import React from "react";
import Header from "./header";
import ChainSelector from "../ChainSelector/ChainSelector";

export function Layout({ children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
            <ChainSelector />
            <Header>
            </Header>
            {children}
        </div>
    )
}
