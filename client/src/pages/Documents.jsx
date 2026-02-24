import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import Layout from "../components/Layout";
import CardSkeleton from "../components/CardSkeleton";
import api from "../services/api";
import { documentService } from "../services/documentService";
import { useEffect } from "react";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "passport", label: "Passport" },
  { value: "deed", label: "Deed" },
  { value: "health_record", label: "Health Record" },
  { value: "other", label: "Other" },
];

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [uploadData, setUploadData] = useState({
    file: null,
    name: "",
    category: "other",
    description: "",
    tags: "",
  });

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params =
        selectedCategory !== "all" ? { category: selectedCategory } : {};
      const data = await documentService.getAll(params);
      setDocuments(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setError("");

      const response = await api.get("/documents/generate-report", {
        responseType: "blob",
      });

      // Create a download link
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Family_Documents_Report_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err.message ||
          err.response?.data?.message ||
          "Failed to generate report",
      );
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("File selected:", file);
    if (file) {
      setUploadData({
        ...uploadData,
        file,
        name: file.name,
      });
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadData.file) {
      setError("Please select a file");
      return;
    }

    // Validate filze size (max. 10MB)
    if (uploadData.file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];
    if (!allowedTypes.includes(uploadData.file.type)) {
      setError(
        "Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, and PNG allowed.",
      );
      return;
    }

    // Validate name
    if (!uploadData.name.trim()) {
      setError("Please provide a document name");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", uploadData.file);
      formData.append("name", uploadData.name);
      formData.append("category", uploadData.category);
      formData.append("description", uploadData.description);
      formData.append("tags", uploadData.tags);

      await documentService.upload(formData);

      // Reset form
      setUploadData({
        file: null,
        name: "",
        category: "other",
        description: "",
        tags: "",
      });
      setUploadDialogOpen(false);

      // Refresh documents list
      fetchDocuments();
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await documentService.delete(id);
      fetchDocuments();
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Delete failed");
    }
  };

  // Format category for display
  const formatCategory = (category) => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <Layout>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h4">Documents</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={handleGenerateReport}
            disabled={generating || documents.length === 0}
            size="small"
          >
            {generating ? "Generating..." : "Generate Report"}
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
            size="small"
          >
            Upload Document
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          select
          label="Filter by Category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 200 } }}
          size="small"
        >
          {categories.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {loading ? (
        <CardSkeleton count={6} />
      ) : documents.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <DescriptionIcon
              sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              No documents found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload your first document to get started
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {documents.map((doc) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={doc._id}
              sx={{
                flex: "0 0 auto",
                width: {
                  xs: "100%",
                  sm: "calc(50% - 18px)",
                  md: "calc(33.333% - 24px)"
                }
              }}
            >
              <Card sx= {{ width: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <DescriptionIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6" noWrap>
                      {doc.name}
                    </Typography>
                  </Box>

                  <Chip
                    label={formatCategory(doc.category)}
                    size="small"
                    sx={{ mb: 1 }}
                  />

                  {doc.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        lineClamp: 2,
                        WebkitLineClamp: 2,
                        boxOrient: "vertical",
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {doc.description}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(doc.fileSize)} •
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </Typography>

                  {doc.tags && doc.tags.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {doc.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      let viewUrl = doc.fileURL;

                      if (doc.fileType === "application/pdf") {
                        // Add .pdf extension if missing
                        if (!viewUrl.endsWith(".pdf")) {
                          viewUrl = viewUrl + ".pdf";
                        }
                      }

                      window.open(viewUrl, "_blank");
                    }}
                  >
                    View
                  </Button>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(doc._id, doc.name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
            >
              {uploadData.file ? uploadData.file.name : "Choose file"}
              <input
                type="file"
                hidden
                onChange={handleFileChange}
                accept=".pdf, .doc, .docx, .jpg, .jpef, .png"
              />
            </Button>

            <TextField
              fullWidth
              label="Document Name"
              value={uploadData.name}
              onChange={(e) =>
                setUploadData({ ...uploadData, name: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              select
              label="Category"
              value={uploadData.category}
              onChange={(e) =>
                setUploadData({ ...uploadData, category: e.target.value })
              }
              sx={{ mb: 2 }}
            >
              {categories.slice(1).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Description (optional)"
              multiline
              rows={3}
              value={uploadData.description}
              onChange={(e) =>
                setUploadData({ ...uploadData, description: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Tags (comma separated, optional)"
              value={uploadData.tags}
              onChange={(e) =>
                setUploadData({ ...uploadData, tags: e.target.value })
              }
              helperText="e.g., important, legal, 2024"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUploadDialogOpen(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUploadSubmit}
            variant="contained"
            disabled={uploading || !uploadData.file}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default Documents;
