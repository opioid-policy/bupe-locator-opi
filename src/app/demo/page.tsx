// src/app/demo/page.tsx
"use client";
import { useState } from 'react';
import styles from './Demo.module.css';
import Link from 'next/link';
import { T } from '@/lib/i18n-markers';

export default function DemoPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: "Welcome to the Bupe Access Tool",
      content: "This tool helps you find and report pharmacies that fill buprenorphine prescriptions.",
      bullets: [
        "Community-driven data",
        "Privacy-focused design",
        "Help others access treatment"
      ]
    },
    {
      title: "Finding Pharmacies",
      content: "Step 1: Enter your ZIP code",
      bullets: [
        "See pharmacies within 30 miles",
        "View success/denial reports",
        "Check recent trends"
      ]
    },
    {
      title: "Reporting Your Experience",
      content: "Step 2: Share if you could fill your prescription",
      bullets: [
        "Search for your pharmacy",
        "Report success or denial",
        "Add helpful notes for others"
      ]
    },
    {
      title: "Privacy Protected",
      content: "Your privacy is our priority",
      bullets: [
        "No personal information collected",
        "No IP address tracking",
        "Anonymous reporting only"
      ]
    }
  ];

  return (
    <div className={styles.demoContainer}>
      <div className={styles.slideshow}>
        <div className={styles.slide}>
          <h2>{slides[currentSlide].title}</h2>
          <p>{slides[currentSlide].content}</p>
          <ul>
            {slides[currentSlide].bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </div>
        
        <div className={styles.controls}>
          <button 
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
          >
            ← Previous
          </button>
          <span>{currentSlide + 1} / {slides.length}</span>
          <button 
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
          >
            Next →
          </button>
        </div>
      </div>
      
      <Link href="/" className={styles.startButton}>
        <T>Start Using the Tool</T>
      </Link>
    </div>
  );
}