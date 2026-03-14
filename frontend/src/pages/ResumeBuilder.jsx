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
    const element = resumeRef.current;
    const canvas = await html2canvas(element, { 
      scale: 3, // Higher scale for better OCR if needed, though we want text
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, "", "FAST");
    pdf.save(`${resumeData.personal_information.fullName || "Resume"}.pdf`);
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
      <div key={field.id} className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>{field.label}</Label>
          {(field.ai_generate || field.ai_optimize) && (
            <button
              onClick={handleAIOptimize}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span className="text-lg">✨</span> {field.ai_generate ? "AI Generate" : "AI Optimize"}
            </button>
          )}
        </div>
        {field.type === "textarea" ? (
          <Textarea
            value={value}
            onChange={onChange}
            className="min-h-[100px]"
            placeholder={field.examples ? `e.g. ${field.examples.join(", ")}` : ""}
          />
        ) : (
          <Input
            type={field.type}
            value={value}
            onChange={onChange}
            placeholder={field.examples ? `e.g. ${field.examples.join(", ")}` : ""}
          />
        )}
      </div>
    );
  };

  const currentSection = INTERVIEW_FLOW[currentStep];

  return (
    <div className="cb-container py-10">
      <div className="max-w-4xl mx-auto">
        {!showPreview ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {currentSection.title}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Step {currentStep + 1} of {INTERVIEW_FLOW.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  <Button onClick={nextStep}>
                    {currentStep === INTERVIEW_FLOW.length - 1
                      ? "Preview Resume"
                      : "Next"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-6">
              {currentSection.repeatable ? (
                <div className="space-y-8">
                  {resumeData[currentSection.section].map((_, index) => (
                    <div
                      key={index}
                      className="p-4 border border-slate-200 rounded-lg relative bg-slate-50/50"
                    >
                      {resumeData[currentSection.section].length > 1 && (
                        <button
                          onClick={() =>
                            removeRepeatableField(currentSection.section, index)
                          }
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {currentSection.fields.map((field) =>
                          renderField(field, currentSection.section, index)
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    onClick={() => addRepeatableField(currentSection.section)}
                    className="w-full border-dashed"
                  >
                    + Add {currentSection.title}
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
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
                  <span>🖨️</span> Print to PDF (Best for ATS)
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
