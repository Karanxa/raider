import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BountyReporting = () => {
  const session = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [impact, setImpact] = useState("");
  const [proofOfConcept, setProofOfConcept] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [severity, setSeverity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("Please login to submit reports");
      return;
    }

    if (!title || !description || !stepsToReproduce || !impact || !severity) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("bounty_reports").insert({
        user_id: session.user.id,
        title,
        description,
        steps_to_reproduce: stepsToReproduce,
        impact,
        proof_of_concept: proofOfConcept,
        recommendations,
        severity,
      });

      if (error) throw error;

      toast.success("Report submitted successfully!");
      // Reset form
      setTitle("");
      setDescription("");
      setStepsToReproduce("");
      setImpact("");
      setProofOfConcept("");
      setRecommendations("");
      setSeverity("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief title of the vulnerability"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the vulnerability"
            className="min-h-[100px]"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="steps">Steps to Reproduce *</Label>
          <Textarea
            id="steps"
            value={stepsToReproduce}
            onChange={(e) => setStepsToReproduce(e.target.value)}
            placeholder="1. First step&#10;2. Second step&#10;3. Third step"
            className="min-h-[150px]"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="impact">Impact *</Label>
          <Textarea
            id="impact"
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            placeholder="Describe the potential impact of this vulnerability"
            className="min-h-[100px]"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="poc">Proof of Concept</Label>
          <Textarea
            id="poc"
            value={proofOfConcept}
            onChange={(e) => setProofOfConcept(e.target.value)}
            placeholder="Add any supporting material, references, or proof of concept"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recommendations">Recommendations</Label>
          <Textarea
            id="recommendations"
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            placeholder="Suggested fixes or mitigations"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="severity">Severity *</Label>
          <Select value={severity} onValueChange={setSeverity} required>
            <SelectTrigger>
              <SelectValue placeholder="Select severity level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="info">Informational</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </Button>
      </form>
    </Card>
  );
};

export default BountyReporting;