import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import RecommendedServices from "@/components/RecommendedServices";
import ServicesList from "@/components/ServicesList";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Categories />
        <RecommendedServices />
        <ServicesList />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
