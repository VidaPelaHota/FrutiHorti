import styled from "styled-components";
import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;

        font-synthesis: none;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -webkit-text-size-adjust: 100%;

        font-family: "Plus Jakarta Sans", sans-serif;
        font-optical-sizing: auto;
    }

    :root {
        font-size: 62.5%;

        --white: #fff;
        --black: #1b1b1a;
        --text-green: #c4d8c3;
        --solid-green: #186d37;
        --softer-green: #e4ecd2;
        --background-green: #fafbf2;
        --soft-gray: #9ca3af;
        --heavy-gray: #3c3c3a;
        --border-gray: #e5e7eb;
    }
`;

export const Text = styled.h3`
    font-family: ${({ fontFamily }) => fontFamily || 'Plus Jakarta Sans, sans-serif'};
    color: ${({ color }) => color || 'var(--black)'};
    font-size: ${({ fontSize }) => fontSize || '1.4rem'};
    font-weight: ${({ fontWeight }) => fontWeight || 400};
    letter-spacing: ${({ letterSpacing }) => letterSpacing || '0rem'};
    word-spacing: ${({ wordSpacing }) => wordSpacing || '0rem'};
`;