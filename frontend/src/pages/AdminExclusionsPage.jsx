import Layout from "../components/Layout";
import ExclusionOverview from "../components/ExclusionOverview";
export default function AdminExclusionsPage() {
  return <Layout title="Demandes exclues" subtitle="IFC-based financing eligibility, refusal reasons and outstanding reviews."><ExclusionOverview full /></Layout>;
}
