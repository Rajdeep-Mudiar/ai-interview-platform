import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input, Label, Textarea } from "../components/ui/Form";
import { cn } from "../components/ui/cn";

const INTERVIEW_FLOW = [
  {
    section: "personal_information",
    title: "Personal Information",
    fields: [
      { id: "fullName", label: "Full Name", type: "text", required: true },
      { id: "email", label: "Email Address", type: "email", required: true },
      { id: "phone", label: "Phone Number", type: "text" },
      { id: "location", label: "City / Country", type: "text" },
      { id: "linkedin", label: "LinkedIn URL", type: "url" },
      { id: "github", label: "GitHub URL", type: "url" },
    ],
  },
  {
    section: "summary",
    title: "Professional Summary",
    fields: [
      {
        id: "summary",
        label: "Brief professional summary",
        type: "textarea",
        ai_generate: true,
      },
    ],
  },
  {
    section: "skills",
    title: "Skills",
    fields: [
      {
        id: "skills",
        label: "Technical Skills (comma separated)",
        type: "text", // using text for simplicity, user can input comma separated
        examples: ["JavaScript", "Python", "React", "Machine Learning"],
      },
    ],
  },
  {
    section: "education",
    title: "Education",
    repeatable: true,
    fields: [
      { id: "degree", label: "Degree", type: "text" },
      { id: "institution", label: "Institution", type: "text" },
      { id: "year", label: "Year", type: "number" },
    ],
  },
  {
    section: "experience",
    title: "Work Experience",
    repeatable: true,
    fields: [
      { id: "jobTitle", label: "Job Title", type: "text" },
      { id: "company", label: "Company", type: "text" },
      { id: "duration", label: "Duration", type: "text" },
      {
        id: "description",
        label: "Responsibilities",
        type: "textarea",
        ai_optimize: true,
      },
    ],
  },
  {
    section: "projects",
    title: "Projects",
    repeatable: true,
    fields: [
      { id: "projectName", label: "Project Name", type: "text" },
      { id: "techStack", label: "Technologies Used", type: "text" },
      { id: "description", label: "Project Description", type: "textarea" },
      { id: "link", label: "Project Link", type: "url" },
    ],
  },
];

export default function ResumeBuilder() {
  const [currentStep, setCurrentStep] = useState(0);
  const [resumeData, setResumeData] = useState({
    personal_information: {},
    summary: "",
    skills: "",
    education: [{}],
    experience: [{}],
    projects: [{}],
  });
  const [showPreview, setShowPreview] = useState(false);
  const resumeRef = useRef();

  const SparklesIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  );

  const PrinterIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );

  const handleInputChange = (section, field, value, index = null) => {
    setResumeData((prev) => {
      if (index !== null) {
        const newSection = [...prev[section]];
        newSection[index] = { ...newSection[index], [field]: value };
        return { ...prev, [section]: newSection };
      } else if (section === "personal_information") {
        return {
          ...prev,
          [section]: { ...prev[section], [field]: value },
        };
      } else {
        return { ...prev, [section]: value };
      }
    });
  };

  const addRepeatableField = (section) => {
    setResumeData((prev) => ({
      ...prev,
      [section]: [...prev[section], {}],
    }));
  };

  const removeRepeatableField = (section, index) => {
    setResumeData((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const generatePDF = async () => {
    try {
      const element = resumeRef.current;
      if (!element) return;
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // If content is longer than one page
      let heightLeft = imgHeight;
      let position = 0;
      const pageHeight = 297;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${resumeData.personal_information.fullName || "Resume"}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Failed to generate PDF. Please try the 'Print to PDF' option instead.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const nextStep = () => {
    if (currentStep < INTERVIEW_FLOW.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowPreview(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderField = (field, section, index = null) => {
    const value =
      index !== null
        ? resumeData[section][index][field.id] || ""
        : section === "personal_information"
        ? resumeData[section][field.id] || ""
        : resumeData[section] || "";

    const onChange = (e) =>
      handleInputChange(section, field.id, e.target.value, index);

    const handleAIOptimize = () => {
      if (field.id === "summary") {
        const skills = resumeData.skills || "relevant technologies";
        handleInputChange(section, field.id, `Results-oriented professional with expertise in ${skills}. Proven track record of delivering scalable solutions and optimizing system performance. Strong background in full-stack development, cross-functional collaboration, and implementing industry best practices.`);
      } else if (field.id === "description") {
        const title = resumeData.experience[index]?.jobTitle || "the role";
        handleInputChange(section, field.id, `• Spearheaded the development of core features for ${title}, resulting in a 20% increase in system efficiency.\n• Orchestrated cross-functional teams to deliver high-impact projects using Agile methodologies.\n• Leveraged technical expertise in modern frameworks to optimize user experience and reduce latency.\n• Mentored junior developers and implemented standardized coding practices to ensure high-quality delivery.`, index);
      }
    };

    return (
      <div key={field.id} className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-bold text-slate-700 tracking-tight">{field.label}</Label>
          {(field.ai_generate || field.ai_optimize) && (
            <button
              onClick={handleAIOptimize}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 transition-all hover:shadow-sm"
            >
              <SparklesIcon /> {field.ai_generate ? "AI Generate" : "AI Optimize"}
            </button>
          )}
        </div>
        {field.type === "textarea" ? (
          <Textarea
            value={value}
            onChange={onChange}
            className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-blue-500/20 text-sm leading-relaxed"
            placeholder={field.examples ? `e.g. ${field.examples.join(", ")}` : "Describe your role and impact..."}
          />
        ) : (
          <Input
            type={field.type}
            value={value}
            onChange={onChange}
            className="h-12 rounded-2xl border-slate-200 focus:ring-blue-500/20 text-sm font-medium"
            placeholder={field.examples ? `e.g. ${field.examples.join(", ")}` : ""}
          />
        )}
      </div>
    );
  };

  const currentSection = INTERVIEW_FLOW[currentStep];

  return (
    <div className="cb-container py-10 sm:py-16">
      <div className="max-w-4xl mx-auto">
        {!showPreview && (
          <div className="mb-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Resume Builder</h1>
                <p className="text-slate-500 mt-1">Fill in your details to create a professional, ATS-friendly resume.</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">
                  Step {currentStep + 1} of {INTERVIEW_FLOW.length}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-8">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / INTERVIEW_FLOW.length) * 100}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="hidden sm:flex justify-between">
              {INTERVIEW_FLOW.map((step, idx) => (
                <button
                  key={step.section}
                  onClick={() => setCurrentStep(idx)}
                  className={cn(
                    "flex flex-col items-center gap-2 group transition-all",
                    idx <= currentStep ? "opacity-100" : "opacity-40 hover:opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    idx === currentStep ? "bg-blue-600 text-white ring-4 ring-blue-100" : 
                    idx < currentStep ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    {idx < currentStep ? <CheckIcon /> : idx + 1}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    idx === currentStep ? "text-blue-600" : "text-slate-500"
                  )}>
                    {step.title.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!showPreview ? (
          <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-200 overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {currentSection.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Please provide your {currentSection.title.toLowerCase()} details below.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="rounded-xl"
                  >
                    Back
                  </Button>
                  <Button onClick={nextStep} className="rounded-xl shadow-md shadow-blue-500/20">
                    {currentStep === INTERVIEW_FLOW.length - 1
                      ? "Preview Resume"
                      : "Continue"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-8 space-y-6">
              {currentSection.repeatable ? (
                <div className="space-y-10">
                  {resumeData[currentSection.section].map((_, index) => (
                    <div
                      key={index}
                      className="p-8 border border-slate-200 rounded-[2rem] relative bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md"
                    >
                      <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                        {currentSection.title} #{index + 1}
                      </div>
                      {resumeData[currentSection.section].length > 1 && (
                        <button
                          onClick={() =>
                            removeRepeatableField(currentSection.section, index)
                          }
                          className="absolute -top-3 right-6 px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-rose-100 hover:bg-rose-100 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                      <div className="grid gap-6 sm:grid-cols-2">
                        {currentSection.fields.map((field) =>
                          renderField(field, currentSection.section, index)
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    onClick={() => addRepeatableField(currentSection.section)}
                    className="w-full border-dashed border-2 py-6 rounded-[1.5rem] bg-slate-50 hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all font-bold"
                  >
                    + Add another {currentSection.title.toLowerCase()}
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {currentSection.fields.map((field) =>
                    renderField(field, currentSection.section)
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                Resume Preview
              </h2>
              <div className="flex gap-3 no-print">
                <Button variant="secondary" onClick={() => setShowPreview(false)}>
                  Back to Editor
                </Button>
                <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
                  <PrinterIcon /> Print to PDF (Best for ATS)
                </Button>
                <Button onClick={generatePDF}>Download PDF</Button>
              </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * { visibility: hidden; }
                .resume-container, .resume-container * { visibility: visible; }
                .resume-container { 
                  position: absolute; 
                  left: 0; 
                  top: 0; 
                  width: 100%; 
                  margin: 0 !important; 
                  padding: 20mm !important;
                  box-shadow: none !important;
                }
                .no-print { display: none !important; }
              }
            `}} />

            <div
              ref={resumeRef}
              className="bg-white p-12 shadow-2xl mx-auto min-h-[297mm] w-[210mm] text-slate-900 font-sans resume-container"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-6 mb-8 text-center">
                <h1 className="text-3xl font-bold uppercase tracking-wide">
                  {resumeData.personal_information.fullName || "Your Name"}
                </h1>
                <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm font-medium text-slate-700">
                  {resumeData.personal_information.email && (
                    <span>{resumeData.personal_information.email}</span>
                  )}
                  {resumeData.personal_information.phone && (
                    <span>| {resumeData.personal_information.phone}</span>
                  )}
                  {resumeData.personal_information.location && (
                    <span>| {resumeData.personal_information.location}</span>
                  )}
                  {resumeData.personal_information.linkedin && (
                    <a
                      href={resumeData.personal_information.linkedin}
                      className="text-blue-700 underline"
                    >
                      | LinkedIn
                    </a>
                  )}
                  {resumeData.personal_information.github && (
                    <a
                      href={resumeData.personal_information.github}
                      className="text-blue-700 underline"
                    >
                      | GitHub
                    </a>
                  )}
                </div>
              </div>

              {/* Summary */}
              {resumeData.summary && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold uppercase border-b-2 border-slate-800 mb-3 tracking-wide">
                    Professional Summary
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-800">
                    {resumeData.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {resumeData.skills && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold uppercase border-b-2 border-slate-800 mb-3 tracking-wide">
                    Core Competencies
                  </h2>
                  <div className="text-sm text-slate-800 leading-relaxed font-medium">
                    {typeof resumeData.skills === "string"
                      ? resumeData.skills
                      : resumeData.skills.join(", ")}
                  </div>
                </div>
              )}

              {/* Experience */}
              {resumeData.experience.some((exp) => exp.jobTitle) && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold uppercase border-b-2 border-slate-800 mb-3 tracking-wide">
                    Work Experience
                  </h2>
                  <div className="space-y-6">
                    {resumeData.experience.map(
                      (exp, i) =>
                        exp.jobTitle && (
                          <div key={i}>
                            <div className="flex justify-between items-baseline">
                              <h3 className="text-base font-bold">
                                {exp.jobTitle} - {exp.company}
                              </h3>
                              <span className="text-sm font-semibold text-slate-700">
                                {exp.duration}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                              {exp.description}
                            </p>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}

              {/* Projects */}
              {resumeData.projects.some((p) => p.projectName) && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold uppercase border-b-2 border-slate-800 mb-3 tracking-wide">
                    Key Projects
                  </h2>
                  <div className="space-y-6">
                    {resumeData.projects.map(
                      (p, i) =>
                        p.projectName && (
                          <div key={i}>
                            <div className="flex justify-between items-baseline">
                              <h3 className="text-base font-bold">{p.projectName}</h3>
                              {p.link && (
                                <a
                                  href={p.link}
                                  className="text-sm text-blue-700 underline"
                                >
                                  Project Link
                                </a>
                              )}
                            </div>
                            {p.techStack && (
                              <p className="text-sm font-bold text-slate-700 mt-1">
                                Technologies: {p.techStack}
                              </p>
                            )}
                            <p className="mt-1 text-sm text-slate-800 leading-relaxed">
                              {p.description}
                            </p>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}

              {/* Education */}
              {resumeData.education.some((edu) => edu.degree) && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold uppercase border-b-2 border-slate-800 mb-3 tracking-wide">
                    Education
                  </h2>
                  <div className="space-y-4">
                    {resumeData.education.map(
                      (edu, i) =>
                        edu.degree && (
                          <div
                            key={i}
                            className="flex justify-between items-baseline"
                          >
                            <div>
                              <span className="font-bold text-base">{edu.degree}</span>
                              <div className="text-sm text-slate-700">{edu.institution}</div>
                            </div>
                            <span className="text-sm font-semibold text-slate-700">
                              {edu.year}
                            </span>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
