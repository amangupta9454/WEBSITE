import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Loader2,
  LogOut,
  CheckCircle,
  Clock,
  ArrowRight,
  Github,
  BookOpen,
  Star,
  Mail,
  ListTodo,
  Code,
  Eye,
  Award,
  Briefcase,
  X,
  CheckSquare,
  FileText,
  AlertCircle,
  Trophy,
  Zap,
  User,
  Settings,
  ImagePlus
} from "lucide-react";

// Normal Intern Dashboard Component
const NormalInternDashboard = ({ internship }) => {
  const navigate = useNavigate();
  const totalMonths = parseInt(internship.duration) || 1;

  const stages = [
    "Shortlisted",
    "Offer Letter",
    ...Array.from({ length: totalMonths }).map(
      (_, i) => `Month ${i + 1} Project`,
    ),
    "Review",
    "Certificate",
  ];

  // Task starts according to start date and duration.
  const startDate = internship.startDate
    ? new Date(internship.startDate)
    : null;
  const isStarted = startDate && startDate <= new Date();
  const submitted = internship.submissions?.length || 0;

  let currentStage = 0;
  if (internship.offerLetterStatus === "Sent") {
    currentStage = 2; // Jump to Month 1
    if (isStarted) {
      currentStage = 2 + submitted;
    }
  }
  if (submitted > 0 && submitted >= totalMonths) {
    currentStage = stages.length - 2; // Review is active

    const lastSubmission = internship.submissions[submitted - 1];
    let isReviewCompleted = false;

    if (lastSubmission && lastSubmission.submittedAt) {
      const submissionDate = new Date(lastSubmission.submittedAt);
      const twoDaysLater = new Date(
        submissionDate.getTime() + 2 * 24 * 60 * 60 * 1000,
      );
      if (new Date() >= twoDaysLater) {
        isReviewCompleted = true;
      }
    }

    if (isReviewCompleted) {
      currentStage = stages.length - 1; // Certificate active (Review ticked)
    }

    if (internship.isCertificateSent) {
      currentStage = stages.length; // Certificate ticked
    }
  }

  const clampedStage = Math.min(currentStage, stages.length - 1);

  const getStageIcon = (stageName) => {
    if (stageName.includes("Shortlisted"))
      return <Star size={16} strokeWidth={2.5} />;
    if (stageName.includes("Offer"))
      return <Mail size={16} strokeWidth={2.5} />;
    if (stageName.includes("Month"))
      return <Code size={16} strokeWidth={2.5} />;
    if (stageName.includes("Review"))
      return <Eye size={16} strokeWidth={2.5} />;
    if (stageName.includes("Certificate"))
      return <Award size={16} strokeWidth={2.5} />;
    return <CheckCircle size={16} />;
  };

  const handleSubmitProject = (taskName = "") => {
    navigate("/project-submission", {
      state: {
        internshipId: internship._id,
        domain: internship.domain,
        studentId: internship.studentId,
        taskName: taskName,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
              {internship.domain}
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              Normal Intern • ID: {internship.studentId}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {internship.startDate && (
              <span className="px-4 py-2 rounded-lg text-sm font-bold border bg-blue-50 text-blue-700 border-blue-200">
                Start Date:{" "}
                {new Date(internship.startDate).toLocaleDateString("en-IN")}
              </span>
            )}
            {internship.endDate && (
              <span className="px-4 py-2 rounded-lg text-sm font-bold border bg-red-50 text-red-700 border-red-200">
                End Date:{" "}
                {new Date(internship.endDate).toLocaleDateString("en-IN")}
              </span>
            )}
            <span
              className={`px-4 py-2 rounded-lg text-sm font-bold border ${internship.offerLetterStatus === "Sent" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}
            >
              Offer Letter: {internship.offerLetterStatus || "Pending"}
            </span>
          </div>
        </div>

        {/* Timeline Horizontal view (dots) */}
        <div className="pt-8 pb-12">
          <div className="flex items-center justify-between relative px-8">
            <div className="absolute left-[52px] right-[52px] top-5 h-1.5 bg-slate-100 -z-10 rounded-full overflow-hidden shadow-inner"></div>
            <div
              className="absolute left-[52px] top-5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-600 -z-10 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{
                width: `calc(${(clampedStage / (stages.length - 1)) * 100}% - ${(clampedStage / (stages.length - 1)) * 104}px)`,
              }}
            ></div>
            {stages.map((stage, idx) => {
              const isCompleted = idx < currentStage;
              const isActive = idx === currentStage;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center relative z-10 group cursor-default"
                >
                  <div className="bg-white p-1 rounded-full relative">
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-40"></div>
                    )}
                    <div
                      className={`w-8 h-8 relative rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
                        isCompleted
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/40 scale-100"
                          : isActive
                            ? "bg-white text-blue-600 border-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-110"
                            : "bg-slate-50 text-slate-300 border-slate-200 scale-95 group-hover:scale-100"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={18} strokeWidth={3} />
                      ) : (
                        getStageIcon(stage)
                      )}
                    </div>
                  </div>
                  <div
                    className={`absolute top-12 flex flex-col items-center transition-all duration-300 ${isActive ? "scale-110 translate-y-1" : ""}`}
                  >
                    <span
                      className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-20 sm:w-24 text-center leading-tight ${
                        isCompleted
                          ? "text-blue-800"
                          : isActive
                            ? "text-blue-600 drop-shadow-sm"
                            : "text-slate-400"
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6">
          Your Assignments
        </h3>
        {isStarted ? (
          <div className="space-y-4">
            {Array.from({
              length: Math.min(
                Math.floor(
                  Math.max(0, (new Date() - startDate) / (1000 * 60 * 60 * 24)),
                ) /
                  30 +
                  1,
                totalMonths,
              ),
            }).map((_, idx) => {
              const isSubmitted = idx < submitted;
              // Ensure sequential submission: only show button if this is the CURRENT pending task
              const isCurrentPending = idx === submitted;

              const assignedTaskName =
                internship.assignedNormalTasks &&
                internship.assignedNormalTasks[idx]
                  ? internship.assignedNormalTasks[idx]
                  : null;

              return (
                <div
                  key={idx}
                  className={`p-6 border rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${isSubmitted ? "border-emerald-100 bg-emerald-50" : "border-blue-100 bg-gradient-to-br from-blue-50 to-white"}`}
                >
                  <div>
                    <h4
                      className={`font-bold text-lg ${isSubmitted ? "text-emerald-900" : "text-blue-900"}`}
                    >
                      {assignedTaskName && !assignedTaskName.startsWith("http")
                        ? `Task: ${assignedTaskName}`
                        : `Task Phase ${idx + 1}`}
                    </h4>
                    {assignedTaskName &&
                      assignedTaskName.startsWith("http") && (
                        <a
                          href={assignedTaskName}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-bold rounded-md transition-colors"
                        >
                          📄 View Task Document
                        </a>
                      )}
                    <p
                      className={`text-sm mt-2 ${isSubmitted ? "text-emerald-700" : "text-blue-700"}`}
                    >
                      {isSubmitted
                        ? "This task has been successfully submitted."
                        : "Submit your assigned task updates to move forward."}
                    </p>
                  </div>
                  {isCurrentPending && (
                    <button
                      onClick={() => handleSubmitProject(assignedTaskName)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 justify-center whitespace-nowrap shrink-0"
                    >
                      Submit Project <ArrowRight size={18} />
                    </button>
                  )}
                  {!isSubmitted && !isCurrentPending && (
                    <div className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold flex items-center gap-2 justify-center shrink-0">
                      Pending Previous
                    </div>
                  )}
                  {isSubmitted && (
                    <div className="px-6 py-3 bg-emerald-200/50 text-emerald-800 rounded-xl font-bold flex items-center gap-2 justify-center shrink-0">
                      <CheckCircle size={18} /> Submitted
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 px-6 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <Clock className="mx-auto text-slate-400 mb-3" size={40} />
            <p className="font-medium text-slate-600">
              Tasks will be visible once your internship starts.
            </p>
            <p className="text-sm mt-1">
              Scheduled Start Date:{" "}
              {startDate ? startDate.toLocaleDateString() : "Pending"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Summer Intern Dashboard Component
const SummerInternDashboard = ({ internship, onRefresh }) => {
  const navigate = useNavigate();
  const [repoInputs, setRepoInputs] = useState({});
  const [submittingRepo, setSubmittingRepo] = useState(null);
  const [finalSubmitting, setFinalSubmitting] = useState(null);

  const handleSubmitRepo = async (projectId) => {
    const link = repoInputs[projectId];
    if (!link || !link.startsWith("https://github.com/")) {
      toast.error("Please enter a valid GitHub repository link.");
      return;
    }
    try {
      setSubmittingRepo(projectId);
      const token = localStorage.getItem("studentToken");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/student/submit-repo`,
        {
          internshipId: internship._id,
          projectId: projectId,
          repoLink: link,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Repository link submitted successfully!");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Failed to submit repository link.");
    } finally {
      setSubmittingRepo(null);
    }
  };

  const handleFinalSubmit = async (projectId) => {
    if (
      !window.confirm(
        "Are you sure you want to final submit this project? You won't be able to edit the link afterwards.",
      )
    )
      return;
    try {
      setFinalSubmitting(projectId);
      const token = localStorage.getItem("studentToken");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/student/final-submit-repo`,
        {
          internshipId: internship._id,
          projectId: projectId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Project final submitted successfully!");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Failed to final submit project.");
    } finally {
      setFinalSubmitting(null);
    }
  };

  const stages = [
    "Shortlisted",
    "Offer Letter",
    "Project Assigned",
    "Review",
    "Completed",
    "Certificate",
  ];

  // Simulated array for multiple projects support based on domain
  const projects = internship.projects?.length > 0 ? internship.projects : [];

  const startDate = internship.startDate ? new Date(internship.startDate) : null;
  const isStarted = startDate && startDate <= new Date();

  let currentStage = 1; // Shortlisted is ticked by default
  
  if (internship.offerLetterStatus === "Sent") {
    currentStage = 2; // Offer Letter is ticked

    const isStartDateReached =
      internship.startDate && new Date() >= new Date(new Date(internship.startDate).setHours(0, 0, 0, 0));

    if (isStartDateReached) {
      currentStage = 3; // Project Assigned ticked, active is Review

      const isEndDateReached =
        internship.endDate && new Date() > new Date(new Date(internship.endDate).setHours(23, 59, 59, 999));

      if (isEndDateReached) {
        currentStage = 5; // Review & Completed ticked, active is Certificate
      }

      if (internship.isCertificateSent) {
        currentStage = stages.length; // All ticked
      }
    }
  }

  const clampedStage = Math.min(currentStage, stages.length - 1);

  const getSummerStageIcon = (stageName) => {
    if (stageName.includes("Shortlisted"))
      return <Star size={22} strokeWidth={2.5} />;
    if (stageName.includes("Offer"))
      return <Mail size={22} strokeWidth={2.5} />;
    if (stageName.includes("Project"))
      return <Briefcase size={22} strokeWidth={2.5} />;
    if (stageName.includes("Review"))
      return <Eye size={22} strokeWidth={2.5} />;
    if (stageName.includes("Completed"))
      return <CheckSquare size={22} strokeWidth={2.5} />;
    if (stageName.includes("Certificate"))
      return <Award size={22} strokeWidth={2.5} />;
    return <CheckCircle size={22} />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
              {internship.domain}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                Summer Internship
              </span>
              <span className="text-slate-500 text-sm font-medium">
                • ID: {internship.studentId}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {internship.startDate && (
              <span className="px-4 py-2 rounded-lg text-sm font-bold border bg-blue-50 text-blue-700 border-blue-200">
                Start Date:{" "}
                {new Date(internship.startDate).toLocaleDateString("en-IN")}
              </span>
            )}
            {internship.endDate && (
              <span className="px-4 py-2 rounded-lg text-sm font-bold border bg-red-50 text-red-700 border-red-200">
                End Date:{" "}
                {new Date(internship.endDate).toLocaleDateString("en-IN")}
              </span>
            )}
            <span
              className={`px-4 py-2 rounded-lg text-sm font-bold border ${internship.offerLetterStatus === "Sent" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}
            >
              Offer Letter: {internship.offerLetterStatus || "Pending"}
            </span>
          </div>
        </div>

        {/* Timeline Horizontal view (circles) */}
        <div className="pt-10 pb-16 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] relative px-10">
            <div className="absolute left-[72px] right-[72px] top-8 h-2 bg-slate-100 -z-10 rounded-full shadow-inner"></div>
            <div
              className="absolute left-[72px] top-8 h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 -z-10 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              style={{
                width: `calc(${(clampedStage / (stages.length - 1)) * 100}% - ${(clampedStage / (stages.length - 1)) * 144}px)`,
              }}
            ></div>
            {stages.map((stage, idx) => {
              const isCompleted = idx < currentStage;
              const isActive = idx === currentStage;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center relative z-10 group cursor-default"
                >
                  <div className="bg-white p-1 rounded-full relative">
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-40"></div>
                    )}
                    <div
                      className={`w-14 h-14 relative rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 border-4 ${
                        isCompleted
                          ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white border-white shadow-lg shadow-orange-500/40 scale-100"
                          : isActive
                            ? "bg-white text-orange-600 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-110"
                            : "bg-slate-50 text-slate-300 border-slate-100 scale-95 group-hover:scale-100"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={28} strokeWidth={3} />
                      ) : (
                        getSummerStageIcon(stage)
                      )}
                    </div>
                  </div>
                  <div
                    className={`absolute top-20 flex flex-col items-center transition-all duration-300 ${isActive ? "scale-110 translate-y-1" : ""}`}
                  >
                    <span
                      className={`text-[10px] sm:text-xs font-black uppercase tracking-wider w-24 sm:w-28 text-center leading-tight ${
                        isCompleted
                          ? "text-orange-700"
                          : isActive
                            ? "text-orange-600 drop-shadow-sm"
                            : "text-slate-400"
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BookOpen className="text-amber-600" /> Assigned Projects
        </h3>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6 shadow-sm shadow-orange-100/50">
          <h4 className="font-bold text-orange-900 flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Mandatory Project Rules & Guidelines
          </h4>
          <ul className="space-y-2 text-sm text-orange-800 font-medium">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>
                You will be assigned{" "}
                <strong className="text-orange-950 font-bold">
                  2-3 projects per month
                </strong>{" "}
                during your internship.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>
                Adding a GitHub repository link for your project is{" "}
                <strong className="text-orange-950 font-bold">mandatory</strong>
                .
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>
                <strong className="text-orange-950 font-bold">
                  Daily code push on GitHub
                </strong>{" "}
                is strictly required.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>
                Create a{" "}
                <strong className="text-orange-950 font-bold">
                  new repository
                </strong>{" "}
                for every new assignment/project you receive.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>
                The Code-A-Nova Team will monitor and{" "}
                <strong className="text-orange-950 font-bold">
                  verify your daily pushes
                </strong>
                .
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>
                Completing the project and following these rules is{" "}
                <strong className="text-orange-950 font-bold">
                  mandatory for your certification
                </strong>
                .
              </span>
            </li>
          </ul>
        </div>

        {!isStarted ? (
          <div className="py-12 px-6 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <Clock className="mx-auto text-slate-400 mb-3" size={40} />
            <p className="font-medium text-slate-600">
              Projects will be visible once your internship starts.
            </p>
            <p className="text-sm mt-1">
              Scheduled Start Date:{" "}
              {startDate ? startDate.toLocaleDateString() : "Pending"}
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 mb-4">
              <BookOpen size={32} className="text-slate-500" />
            </div>
            <h4 className="text-lg font-bold text-slate-700 mb-2">
              No Projects Assigned Yet
            </h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Projects will be assigned to you once your internship officially
              starts. Please wait for your admin to assign projects to you.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {projects.map((proj, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl p-6 transition-colors bg-slate-50"
              >
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">
                        {proj.name}
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">
                        {proj.description}
                      </p>

                      {(proj.createdAt || proj.dueDate) && (
                        <div className="flex gap-4 mt-3 text-xs font-semibold">
                          {proj.createdAt && (
                            <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
                              Assigned:{" "}
                              {new Date(proj.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </div>
                          )}
                          {proj.dueDate && (
                            <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-100">
                              Due Date:{" "}
                              {new Date(proj.dueDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {proj.pdfUrl && (
                      <a
                        href={proj.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 mt-1 md:mt-0 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <FileText size={16} /> Download Project Document
                      </a>
                    )}
                  </div>

                  {proj.isFinalSubmitted ? (
                    <div className="flex flex-col gap-3 mt-4">
                      <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-4 flex items-start gap-4 shadow-sm shadow-emerald-100/50">
                        <div className="bg-emerald-100/80 p-2.5 rounded-xl text-emerald-600 shadow-sm mt-0.5">
                          <CheckCircle size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h5 className="font-bold text-emerald-900 text-sm mb-1">
                            Project Final Submitted Successfully
                          </h5>
                          <p className="text-sm text-emerald-800 leading-relaxed font-medium mb-2">
                            Your GitHub repository and project has been locked and
                            submitted for admin review.
                          </p>
                          <a
                            href={proj.repoLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-200/50 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Github size={14} /> View Repository
                          </a>
                        </div>
                      </div>

                      {proj.reviewStatus && proj.reviewStatus !== "Pending" && (
                        <div className={`border rounded-xl p-4 flex items-start gap-4 shadow-sm ${proj.reviewStatus === 'Accepted' ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100/50' : 'bg-rose-50 border-rose-200 shadow-rose-100/50'}`}>
                          <div className={`p-2.5 rounded-xl shadow-sm mt-0.5 ${proj.reviewStatus === 'Accepted' ? 'bg-emerald-100/80 text-emerald-600' : 'bg-rose-100/80 text-rose-600'}`}>
                            {proj.reviewStatus === 'Accepted' ? <CheckCircle size={20} strokeWidth={2.5} /> : <AlertCircle size={20} strokeWidth={2.5} />}
                          </div>
                          <div className="w-full">
                            <h5 className={`font-bold text-sm mb-1 ${proj.reviewStatus === 'Accepted' ? 'text-emerald-900' : 'text-rose-900'}`}>
                              Admin Review: {proj.reviewStatus}
                            </h5>
                            {proj.feedback && (
                              <div className={`text-sm leading-relaxed font-medium mt-2 p-3 rounded-lg border ${proj.reviewStatus === 'Accepted' ? 'text-emerald-800 bg-emerald-100/50 border-emerald-200' : 'text-rose-800 bg-rose-100/50 border-rose-200'}`}>
                                <strong className="block text-[10px] uppercase tracking-wider mb-1 opacity-70">Feedback</strong>
                                {proj.feedback}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 flex flex-col gap-4 shadow-sm shadow-amber-100/50 mt-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-amber-100/80 p-2.5 rounded-xl text-amber-600 shadow-sm mt-0.5">
                          <Github size={20} strokeWidth={2.5} />
                        </div>
                        <div className="w-full">
                          <h5 className="font-bold text-amber-900 text-sm mb-1">
                            Link Your GitHub Repository
                          </h5>
                          <p className="text-sm text-amber-800 leading-relaxed font-medium mb-3">
                            Save your Github link here. Once your project is
                            fully complete, click the "Final Submit Project"
                            button.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
                            <input
                              type="url"
                              placeholder="https://github.com/username/repo"
                              value={
                                repoInputs[proj.id] !== undefined
                                  ? repoInputs[proj.id]
                                  : proj.repoLink || ""
                              }
                              onChange={(e) =>
                                setRepoInputs({
                                  ...repoInputs,
                                  [proj.id]: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white placeholder-amber-800/40"
                            />
                            <button
                              onClick={() => handleSubmitRepo(proj.id)}
                              disabled={submittingRepo === proj.id}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold transition-colors whitespace-nowrap disabled:opacity-50"
                            >
                              {submittingRepo === proj.id
                                ? "Saving..."
                                : "Save Link"}
                            </button>
                          </div>
                          {proj.repoLink && (
                            <div className="mt-4 pt-4 border-t border-amber-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                                <CheckCircle size={14} /> Link Saved! Ready for
                                Final Submission?
                              </span>
                              <button
                                onClick={() => handleFinalSubmit(proj.id)}
                                disabled={finalSubmitting === proj.id}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
                              >
                                <CheckCircle size={16} /> Final Submit Project
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiRecycle, setConfettiRecycle] = useState(false);

  useEffect(() => {
    if (location.state?.showConfetti) {
      setShowConfetti(true);
      setConfettiRecycle(true);
      setTimeout(() => setConfettiRecycle(false), 10000);
      setTimeout(() => setShowConfetti(false), 15000);

      // Clear state so on refresh it doesn't trigger again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("studentToken");
      if (!token) {
        navigate("/student-login");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/student/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setData(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("studentToken");
        localStorage.removeItem("studentData");
        navigate("/student-login");
      } else {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("studentData");
    navigate("/student-login");
  };

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: "", profileImage: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const openProfileModal = () => {
    if (data?.user) {
      setProfileFormData({
        name: data.user.name || "",
        profileImage: data.user.profileImage || ""
      });
    }
    setIsProfileModalOpen(true);
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error("File size must be less than 2MB");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
        formData
      );
      setProfileFormData({ ...profileFormData, profileImage: res.data.secure_url });
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error("Upload error", err);
      toast.error("Failed to upload image. Please check your connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const token = localStorage.getItem("studentToken");
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/student/profile`,
        { name: profileFormData.name, profileImage: profileFormData.profileImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Profile updated successfully!");
      // Update local state instantly
      setData(prev => ({
        ...prev,
        user: { ...prev.user, name: profileFormData.name, profileImage: profileFormData.profileImage }
      }));
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error("Error saving profile", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDismissNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem("studentToken");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/student/dismiss-notification`,
        { notificationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Remove from UI immediately
      setData(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n._id !== notificationId)
      }));
    } catch (error) {
      toast.error("Failed to dismiss notification");
    }
  };

  const getInternshipMode = (internship) => {
    const explicitType = internship?.internshipType || internship?.mode;
    if (explicitType) return explicitType;

    const duration = parseInt(
      String(internship?.duration || "").match(/\d+/)?.[0] || "1",
      10,
    );
    return duration > 1 ? "Summer/Winter Intern" : "Normal Intern";
  };

  const totalSynergyPoints = data?.internships?.reduce((sum, intern) => sum + (intern.synergyPoints || 0), 0) || 0;

  const getTier = (points) => {
    if (points >= 600) return { title: "Elite Intern", color: "text-purple-600 bg-purple-100 border-purple-200" };
    if (points >= 300) return { title: "Pro Developer", color: "text-orange-600 bg-orange-100 border-orange-200" };
    if (points >= 100) return { title: "Rising Star", color: "text-blue-600 bg-blue-100 border-blue-200" };
    return { title: "Novice Intern", color: "text-emerald-600 bg-emerald-100 border-emerald-200" };
  };
  const currentTier = getTier(totalSynergyPoints);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 px-4 sm:px-6 pb-16 font-sans">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={confettiRecycle}
          numberOfPieces={confettiRecycle ? 500 : 200}
          gravity={0.15}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 99999,
            pointerEvents: "none",
          }}
        />
      )}
      <div className="max-w-6xl mx-auto space-y-6">
        {data?.notifications?.length > 0 && (
          <div className="space-y-3 mb-6">
            {data.notifications.map((notif) => (
              <div key={notif._id} className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm relative">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1 pr-6">
                  <h4 className="font-bold text-blue-900 text-sm mb-1">Important Update</h4>
                  <p className="text-blue-800 text-sm">{notif.message}</p>
                </div>
                <button 
                  onClick={() => handleDismissNotification(notif._id)}
                  className="text-blue-400 hover:text-blue-700 hover:bg-blue-100 p-1 rounded-md transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Header section */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
              {data?.user?.profileImage ? (
                <img
                  src={data.user.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-blue-600">
                  {data?.user?.name?.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Intern Portal
              </p>
              <h1 className="text-xl font-black text-slate-800 leading-tight">
                {data?.user?.name}
              </h1>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={openProfileModal}
              className="px-4 py-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold flex items-center gap-2 border border-transparent hover:border-blue-100 text-sm"
            >
              <Settings size={18} /> Profile
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold flex items-center gap-2 border border-transparent hover:border-red-100 text-sm"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </header>

        {/* Synergy Points Summary Card */}
        <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Your Synergy Score</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800 tracking-tight">{totalSynergyPoints}</span>
                <span className="text-slate-500 font-medium">Points</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full md:w-auto bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800">How to earn more points?</h3>
              </div>
              <p className="text-xs text-slate-500">Submit projects early, write clean code, and help others to climb the leaderboard.</p>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${currentTier.color} font-bold text-sm text-center min-w-[120px]`}>
              {currentTier.title}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <main>
          {data?.internships?.length > 0 ? (
            data.internships.map((internship) => {
              const mode = getInternshipMode(internship);
              return (
                <div key={internship._id} className="mb-10">
                  {mode === "Summer/Winter Intern" ? (
                    <SummerInternDashboard
                      internship={internship}
                      onRefresh={fetchDashboard}
                    />
                  ) : (
                    <NormalInternDashboard internship={internship} />
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white py-16 px-6 text-center rounded-2xl shadow-sm border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-slate-400 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                No Internships Found
              </h3>
              <p className="text-slate-500 font-medium">
                You haven't been assigned any internships yet.
              </p>
            </div>
          )}
        </main>
      </div>
      
      {/* Profile Settings Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User size={20} className="text-blue-600" /> Profile Settings
              </h2>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm bg-slate-50">
                    {profileFormData.profileImage || data?.user?.profileImage ? (
                      <img 
                        src={profileFormData.profileImage || data?.user?.profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-blue-600 bg-blue-50">
                        {(profileFormData.name || data?.user?.name || "U").charAt(0)}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-colors">
                    <ImagePlus size={16} />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {isUploading && <span className="text-xs font-bold text-blue-600 animate-pulse">Uploading image...</span>}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileFormData.name}
                    onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={data?.user?.email || ""}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile</label>
                  <input
                    type="text"
                    value={data?.user?.mobile || ""}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={isSavingProfile || isUploading}
                className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-600/20"
              >
                {isSavingProfile ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving...</>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default StudentDashboard;
