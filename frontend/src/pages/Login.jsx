import axios from "axios";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { HelperText, Input, Label } from "../components/ui/Form";
import { useState } from "react";

const uploadResume = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const res = await axios.post("http://localhost:8000/upload_resume", formData);

  console.log(res.data);
};

function Login() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onUpload() {
    if (!file) return;
    setBusy(true);
    try {
      await uploadResume(file);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="mx-auto grid max-w-xl gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Upload a resume
          </h1>
          <p className="text-sm text-slate-600">
            Start by uploading a resume PDF. We’ll parse it and prepare it for
            matching and interview generation.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">Resume file</div>
            <div className="text-sm text-slate-600">
              Accepted formats depend on backend parsing.
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume">Choose file</Label>
              <Input
                id="resume"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <HelperText>
                Tip: Use a clean, text-based PDF for best results.
              </HelperText>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                {file ? (
                  <>
                    Selected: <span className="font-medium text-slate-900">{file.name}</span>
                  </>
                ) : (
                  "No file selected."
                )}
              </div>
              <Button onClick={onUpload} disabled={!file || busy}>
                {busy ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Login;
