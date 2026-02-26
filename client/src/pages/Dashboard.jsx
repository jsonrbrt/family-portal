import { useAuth } from "../context/useAuth";
import { Typography, Paper, Box, Grid } from "@mui/material";
import {
  Description as DescriptionIcon,
  Photo as PhotoIcon,
  PhotoAlbum as AlbumIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import Layout from "../components/Layout";
import api from '../services/api';
import { useState, useEffect } from "react";

function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    documents: 0,
    photos: 0,
    albums: 0
  });

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
        const [docsRes, photosRes, albumsRes] = await Promise.all([
            api.get('/documents'),
            api.get('/photos'),
            api.get('/albums')
        ]);

        setCounts({
            documents: docsRes.data.length,
            photos: photosRes.data.length,
            albums: albumsRes.data.length
        });
    } catch (err) {
        console.error("Failed to fetch counts:", err);
    }
  };

  const stats = [
    {
      title: "Documents",
      count: counts.documents,
      icon: <DescriptionIcon />,
      color: "#1976d2",
    },
    {
      title: "Photos",
      count: counts.photos,
      icon: <PhotoIcon />,
      color: "#dc004e",
    },
    {
      title: "Albums",
      count: counts.albums,
      icon: <AlbumIcon />,
      color: "#9c27b0",
    },
    {
      title: "Family Members",
      count: user?.family?.members?.length || 0,
      icon: <PeopleIcon />,
      color: "#388e3c",
    },
  ];

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Family: {user?.family?.name}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Paper
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: stat.color,
                color: "white",
                height: 180,
                minHeight: 180,
                width: "100%",
                aspectRatio: "1/1",
              }}
            >
              <Box sx={{ fontSize: 48, mb: 1 }}>{stat.icon}</Box>
              <Typography variant="h4" component="div">
                {stat.count}
              </Typography>
              <Typography variant="body2">{stat.title}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No recent activity yet. Start by uploading some documents or photos.
        </Typography>
      </Paper>
    </Layout>
  );
}

export default Dashboard;
