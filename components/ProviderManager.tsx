"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, PlusCircle, FileDown, FileUp } from "lucide-react";

const ModelSchema = z.object({
  apiName: z.string().min(1, "API Name is required."),
  uiName: z.string().min(1, "UI Name is required."),
  supportsTools: z.boolean(),
});

const ProviderSchema = z.object({
  provider: z.string().min(1, "Provider name is required."),
  apiKeyEnvVar: z.string().min(1, "API Key Env Var is required."),
  baseUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  models: z.array(ModelSchema).min(1, "At least one model is required."),
});

const ProvidersListSchema = z.array(ProviderSchema);

const FormSchema = z.object({
  providers: ProvidersListSchema,
});

type FormValues = z.infer<typeof FormSchema>;

export function ProviderManager() {
  const [outputJson, setOutputJson] = useState("");
  const [importJson, setImportJson] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      providers: [
        {
          provider: "Groq",
          apiKeyEnvVar: "GROQ_API_KEY",
          baseUrl: "https://api.groq.com/openai/v1",
          models: [
            {
              apiName: "llama3-8b-8192",
              uiName: "Llama 3 8B",
              supportsTools: true,
            },
          ],
        },
      ],
    },
    mode: "onChange",
  });

  const {
    fields: providerFields,
    append: appendProvider,
    remove: removeProvider,
  } = useFieldArray({
    control: form.control,
    name: "providers",
  });

  const onSubmit = (data: FormValues) => {
    const oneLineJson = JSON.stringify(data.providers);
    setOutputJson(oneLineJson);
    toast.success("JSON Generated!", {
      description: "The one-line JSON has been created below.",
    });
  };

  const handleImport = () => {
    if (!importJson.trim()) {
      toast.error("Import field is empty.", {
        description: "Please paste your JSON array to import.",
      });
      return;
    }
    try {
      const parsed = JSON.parse(importJson);
      const validation = ProvidersListSchema.safeParse(parsed);

      if (!validation.success) {
        console.error(validation.error);
        toast.error("Invalid JSON structure.", {
          description:
            "The provided JSON does not match the required schema. Check console for details.",
        });
        return;
      }

      form.reset({ providers: validation.data });
      toast.success("Import Successful!", {
        description: "The form has been updated with your data.",
      });
    } catch (error) {
      toast.error("Invalid JSON format.", {
        description: "Could not parse the JSON. Please check for syntax errors.",
      });
        console.error("Import error:", error);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* --- Part 1: The Importer --- */}
      <Card>
        <CardHeader>
          <CardTitle>Import & Edit</CardTitle>
          <CardDescription>
            Paste an existing JSON array of providers here to load it into the
            form for editing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder='[{"provider":"MyProvider","apiKeyEnvVar":"MY_API_KEY",...}]'
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            rows={5}
          />
        </CardContent>
        <CardFooter>
          <Button type="button" onClick={handleImport}>
            <FileUp className="mr-2 h-4 w-4" />
            Import & Edit
          </Button>
        </CardFooter>
      </Card>

      {/* --- Part 2: The Form --- */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {providerFields.map((providerField, providerIndex) => (
            <Card key={providerField.id} className="relative">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-3 -top-3 h-7 w-7 rounded-full"
                onClick={() => removeProvider(providerIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <CardHeader>
                <CardTitle>Provider #{providerIndex + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`providers.${providerIndex}.provider`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Groq" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`providers.${providerIndex}.apiKeyEnvVar`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key Env Var</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., GROQ_API_KEY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`providers.${providerIndex}.baseUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://api.groq.com/openai/v1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* --- Nested Form Array for Models --- */}
                <ModelArray control={form.control} providerIndex={providerIndex} />
              </CardContent>
            </Card>
          ))}

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendProvider({
                  provider: "",
                  apiKeyEnvVar: "",
                  baseUrl: "",
                  models: [{ apiName: "", uiName: "", supportsTools: false }],
                })
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Provider
            </Button>
            <Button type="submit">
              <FileDown className="mr-2 h-4 w-4" />
              Generate JSON
            </Button>
          </div>
        </form>
      </Form>

      {/* --- Part 3: The Output --- */}
      {outputJson && (
        <Card>
          <CardHeader>
            <CardTitle>Generated One-Line JSON</CardTitle>
            <CardDescription>
              Here is your generated configuration. You can copy it from the
              text box below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea readOnly value={outputJson} rows={5} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}


function ModelArray({
  control,
  providerIndex,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  providerIndex: number;
}) {
  const {
    fields: modelFields,
    append: appendModel,
    remove: removeModel,
  } = useFieldArray({
    control,
    name: `providers.${providerIndex}.models`,
  });

  return (
    <div className="space-y-4 rounded-md border bg-muted/50 p-4">
      <h4 className="font-semibold">Models</h4>
      {modelFields.map((modelField, modelIndex) => (
        <div
          key={modelField.id}
          className="flex items-start gap-4 rounded-md border bg-background p-4"
        >
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name={`providers.${providerIndex}.models.${modelIndex}.apiName`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Name</FormLabel>
                  <FormControl>
                    <Input placeholder="llama3-8b-8192" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`providers.${providerIndex}.models.${modelIndex}.uiName`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UI Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Llama 3 8B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex h-full flex-col justify-between">
            <FormField
              control={control}
              name={`providers.${providerIndex}.models.${modelIndex}.supportsTools`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Supports Tools</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 self-end text-muted-foreground"
              onClick={() => removeModel(modelIndex)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          appendModel({ apiName: "", uiName: "", supportsTools: false })
        }
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Model
      </Button>
    </div>
  );
}