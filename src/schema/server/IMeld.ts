import { ICardStack } from "./ICardStack.js";

export interface IMeld extends ICardStack {
    meldType: 'mixed' | 'natural';
    isCanasta: boolean;
}