'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { invoke } from '@tauri-apps/api';
import '@xterm/xterm/css/xterm.css';

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState<XTerm | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const newFitAddon = new FitAddon();
    const newTerm = new XTerm({
      fontFamily: 'Jetbrains Mono',
      allowTransparency: true,
      cursorBlink: true,
      cursorStyle: 'bar',
      theme: {
        background: 'transparent',
        foreground: '#ff0000',
      },
    });

    newTerm.loadAddon(newFitAddon);
    newTerm.open(terminalRef.current);

    setTerm(newTerm);
    setFitAddon(newFitAddon);

    // Initialize shell
    const initShell = async () => {
      try {
        await invoke('async_create_shell');
      } catch (error) {
        // On Linux it might show "Operation not permitted (os error 1)" but still works
        console.error('Error creating shell:', error);
      }
    };

    initShell();

    return () => {
      newTerm.dispose();
    };
  }, []);

  // Setup terminal data handlers
  useEffect(() => {
    if (!term) return;

    // Write data from the terminal to the pty
    const writeToPty = (data: string) => {
      invoke('async_write_to_pty', { data }).catch(console.error);
    };

    // Register the data handler
    term.onData(writeToPty);
  }, [term]);

  // Handle terminal resize
  useEffect(() => {
    if (!term || !fitAddon) return;

    const fitTerminal = async () => {
      fitAddon.fit();
      await invoke('async_resize_pty', {
        rows: term.rows,
        cols: term.cols,
      }).catch(console.error);
    };

    // Fit terminal initially and on window resize
    fitTerminal();
    window.addEventListener('resize', fitTerminal);

    return () => {
      window.removeEventListener('resize', fitTerminal);
    };
  }, [term, fitAddon]);

  // Read data from the PTY and write it to the terminal
  useEffect(() => {
    if (!term) return;

    const writeToTerminal = (data: string) => {
      return new Promise<void>((resolve) => {
        term.write(data, () => resolve());
      });
    };

    let frameId: number;

    const readFromPty = async () => {
      try {
        const data = await invoke<string>('async_read_from_pty');

        if (data) {
          await writeToTerminal(data);
        }

        frameId = window.requestAnimationFrame(readFromPty);
      } catch (error) {
        console.error('Error reading from PTY:', error);
        frameId = window.requestAnimationFrame(readFromPty);
      }
    };

    readFromPty();

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [term]);

  return <div id="terminal" ref={terminalRef} />;
}
